from flask import Flask, render_template, request, redirect, url_for, flash, make_response
from flask_bcrypt import Bcrypt
from authlib.integrations.flask_client import OAuth
from flask_limiter import Limiter
from flask_limiter.util import get_remote_address
from flask_jwt_extended import JWTManager, create_access_token, jwt_required, get_jwt_identity, set_access_cookies, unset_jwt_cookies
from models import db, User
from datetime import datetime, timedelta
import os
from dotenv import load_dotenv
import pyotp
import secrets
from functools import wraps

load_dotenv()

app = Flask(__name__)
app.config['SECRET_KEY'] = os.getenv('SECRET_KEY', secrets.token_hex(32))
database_url = os.getenv('DATABASE_URL', 'sqlite:///ads.db')
if database_url.startswith('postgres://'):
    database_url = database_url.replace('postgres://', 'postgresql+psycopg://', 1)
elif database_url.startswith('postgresql://'):
    database_url = database_url.replace('postgresql://', 'postgresql+psycopg://', 1)
app.config['SQLALCHEMY_DATABASE_URI'] = database_url
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
app.config['JWT_SECRET_KEY'] = os.getenv('JWT_SECRET_KEY', secrets.token_hex(32))
app.config['JWT_TOKEN_LOCATION'] = ['cookies']
app.config['JWT_COOKIE_SECURE'] = True  # Set to True in production with HTTPS
app.config['JWT_COOKIE_CSRF_PROTECT'] = True
app.config['JWT_ACCESS_TOKEN_EXPIRES'] = timedelta(hours=1)
app.config['SESSION_COOKIE_SECURE'] = True
app.config['SESSION_COOKIE_HTTPONLY'] = True
app.config['ADSENSE_ENABLED'] = os.getenv('ADSENSE_ENABLED', 'false').lower() == 'true'
app.config['ADSENSE_CLIENT_ID'] = os.getenv('ADSENSE_CLIENT_ID', '').strip()
app.config['ADSENSE_SLOT_ID_VIEW_AD'] = os.getenv('ADSENSE_SLOT_ID_VIEW_AD', '').strip()
db.init_app(app)
bcrypt = Bcrypt(app)
jwt = JWTManager(app)

oauth = OAuth(app)
google = oauth.register(
    name='google',
    client_id=os.getenv('GOOGLE_CLIENT_ID'),
    client_secret=os.getenv('GOOGLE_CLIENT_SECRET'),
    server_metadata_url='https://accounts.google.com/.well-known/openid-configuration',
    client_kwargs={'scope': 'openid email profile'},
)

limiter = Limiter(get_remote_address, app=app, default_limits=["200 per day", "50 per hour"])

# Custom decorator for JWT protected routes
def login_required(f):
    @wraps(f)
    @jwt_required()
    def decorated_function(*args, **kwargs):
        return f(*args, **kwargs)
    return decorated_function

def get_current_user():
    user_id = get_jwt_identity()
    return User.query.get(int(user_id)) if user_id else None

@app.route('/')
def index():
    try:
        user_id = get_jwt_identity()
        if user_id:
            return redirect(url_for('dashboard'))
    except:
        pass
    return render_template('index.html')

@app.route('/signup', methods=['GET', 'POST'])
def signup():
    if request.method == 'POST':
        email = request.form['email']
        password = request.form['password']
        if User.query.filter_by(email=email).first():
            flash('Email already exists')
            return redirect(url_for('signup'))
        hashed = bcrypt.generate_password_hash(password).decode('utf-8')
        user = User(email=email, password_hash=hashed)
        db.session.add(user)
        db.session.commit()
        flash('Account created! Now set up 2FA.')
        
        # Create JWT token
        access_token = create_access_token(identity=user.id)
        response = make_response(redirect(url_for('setup_2fa')))
        set_access_cookies(response, access_token)
        return response
    return render_template('signup.html')

@app.route('/setup_2fa')
@login_required
def setup_2fa():
    current_user = get_current_user()
    if current_user.twofa_secret is None:
        secret = pyotp.random_base32()
        current_user.twofa_secret = secret
        current_user.twofa_enabled = True
        db.session.commit()
    totp_uri = pyotp.totp.TOTP(current_user.twofa_secret).provisioning_uri(current_user.email, issuer_name="YourApp")
    return render_template('setup_2fa.html', secret=current_user.twofa_secret, uri=totp_uri)

@app.route('/login', methods=['GET', 'POST'])
@limiter.limit("1 per 5 seconds")
def login():
    if request.method == 'POST':
        email = request.form['email']
        password = request.form['password']
        totp_code = request.form.get('totp_code', '')
        
        user = User.query.filter_by(email=email).first()
        if not user or not bcrypt.check_password_hash(user.password_hash, password):
            flash('Invalid email or password')
            return redirect(url_for('login'))
        
        # Check 2FA if enabled
        if user.twofa_enabled:
            if not totp_code:
                flash('2FA code required')
                return redirect(url_for('login'))
            if not user.verify_totp(totp_code):
                flash('Invalid 2FA code')
                return redirect(url_for('login'))
        
        # Create JWT token
        access_token = create_access_token(identity=user.id)
        response = make_response(redirect(url_for('dashboard')))
        set_access_cookies(response, access_token)
        flash('Login successful!')
        return response
    
    return render_template('login.html')

@app.route('/logout')
@login_required
def logout():
    response = make_response(redirect(url_for('index')))
    unset_jwt_cookies(response)
    flash('You have been logged out.')
    return response

@app.route('/auth/google')
def google_auth():
    redirect_uri = url_for('google_callback', _external=True)
    return google.authorize_redirect(redirect_uri)

@app.route('/google/callback')
def google_callback():
    try:
        token = google.authorize_access_token()
    except Exception:
        flash('Google login failed')
        return redirect(url_for('login'))

    user_info = token.get('userinfo')
    if not user_info:
        user_info = google.get('https://openidconnect.googleapis.com/v1/userinfo').json()

    if user_info:
        email = user_info.get('email')
        google_id = user_info.get('sub') or user_info.get('id')

        # Find or create user
        user = User.query.filter_by(google_id=google_id).first()
        if not user:
            user = User.query.filter_by(email=email).first()
            if not user:
                user = User(email=email, google_id=google_id)
                db.session.add(user)
            else:
                user.google_id = google_id
            db.session.commit()

        # Create JWT token
        access_token_jwt = create_access_token(identity=user.id)
        response = make_response(redirect(url_for('dashboard')))
        set_access_cookies(response, access_token_jwt)
        flash('Login successful!')
        return response
    
    flash('Failed to get user info from Google')
    return redirect(url_for('login'))

@app.route('/view-ad')
@login_required
@limiter.limit("1 per 5 seconds")
def view_ad():
    current_user = get_current_user()
    now = datetime.utcnow()
    if current_user.last_view_time and now - current_user.last_view_time < timedelta(seconds=10):
        flash('Wait 10 seconds before next view (anti-bot)')
        return redirect(url_for('dashboard'))
    
    # Simulate ad view (in real: show page with timer + JS beacon)
    current_user.visit_count += 1
    current_user.last_view_time = now
    db.session.commit()

    adsense_ready = (
        app.config['ADSENSE_ENABLED']
        and bool(app.config['ADSENSE_CLIENT_ID'])
        and bool(app.config['ADSENSE_SLOT_ID_VIEW_AD'])
    )
    
    return render_template(
        'view_ad.html',
        user=current_user,
        adsense_enabled=adsense_ready,
        adsense_client_id=app.config['ADSENSE_CLIENT_ID'],
        adsense_slot_id_view_ad=app.config['ADSENSE_SLOT_ID_VIEW_AD'],
    )

@app.route('/dashboard')
@login_required
def dashboard():
    current_user = get_current_user()
    top_users = User.query.order_by(User.visit_count.desc()).limit(10).all()
    return render_template('dashboard.html', user=current_user, top_users=top_users)

# Add logout, etc.

# Create DB
with app.app_context():
    db.create_all()

if __name__ == '__main__':
    app.run(debug=True)