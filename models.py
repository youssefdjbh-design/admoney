from flask_sqlalchemy import SQLAlchemy
from datetime import datetime
import pyotp

db = SQLAlchemy()

class User(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    email = db.Column(db.String(120), unique=True, nullable=False)
    password_hash = db.Column(db.String(255), nullable=True)  # null if OAuth only
    google_id = db.Column(db.String(100), unique=True, nullable=True)
    twofa_secret = db.Column(db.String(32), nullable=True)     # for TOTP
    twofa_enabled = db.Column(db.Boolean, default=False)
    balance = db.Column(db.Float, default=0.0)
    visit_count = db.Column(db.Integer, default=0)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    last_view_time = db.Column(db.DateTime, nullable=True)

    def verify_totp(self, token):
        if not self.twofa_secret:
            return False
        totp = pyotp.TOTP(self.twofa_secret)
        return totp.verify(token)