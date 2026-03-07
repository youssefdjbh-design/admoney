# AdViewer - Watch Ads & Earn Money

A Flask-based web application that allows users to watch advertisements and earn money. Features include secure JWT authentication, 2FA, rate limiting, and OAuth integration.

## Features

- 🔐 **Secure Authentication**: JWT cookies for session management
- 🔒 **Two-Factor Authentication (2FA)**: TOTP-based 2FA with QR code setup
- 🌐 **OAuth Integration**: Login with Google
- ⏱️ **Rate Limiting**: 1 ad view per 5 seconds to prevent abuse
- 💰 **Earnings Tracking**: Track views and balance
- 🏆 **Leaderboard**: See top earners
- 🎨 **Modern UI**: Beautiful, responsive design

## Installation

1. Clone the repository and navigate to the project folder

2. Install dependencies:
```bash
pip install -r requirements.txt
```

3. Create a `.env` file based on `.env.example`:
```bash
cp .env.example .env
```

4. Edit `.env` and add your secret keys:
```
SECRET_KEY=your-random-secret-key
JWT_SECRET_KEY=your-jwt-secret-key
DATABASE_URL=sqlite:///ads.db
```

For Google OAuth (optional):
- Get credentials from [Google Cloud Console](https://console.cloud.google.com/)
- Add `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` to `.env`

## Usage

1. Run the application:
```bash
python app.py
```

2. Open your browser and navigate to:
```
http://localhost:5000
```

3. Create an account and set up 2FA

4. Start watching ads and earning money!

## Security Features

- **JWT Cookies**: Secure token-based authentication
- **CSRF Protection**: Built-in CSRF protection for JWT cookies
- **Password Hashing**: Bcrypt for secure password storage
- **2FA**: Time-based one-time passwords (TOTP)
- **Rate Limiting**: Prevents abuse with 1 request per 5 seconds on sensitive endpoints

## API Endpoints

- `GET /` - Home page
- `GET/POST /signup` - Create new account
- `GET/POST /login` - Login (rate-limited: 1 per 5 seconds)
- `GET /logout` - Logout and clear JWT cookies
- `GET /setup_2fa` - Setup two-factor authentication
- `GET /dashboard` - User dashboard (protected)
- `GET /view-ad` - View advertisement (protected, rate-limited: 1 per 5 seconds)
- `GET /auth/google` - Google OAuth login
- `GET /google/callback` - Google OAuth callback

## Project Structure

```
ads/
├── app.py              # Main Flask application
├── models.py           # Database models
├── requirements.txt    # Python dependencies
├── .env.example        # Environment variables template
├── templates/          # HTML templates
│   ├── base.html       # Base template
│   ├── index.html      # Home page
│   ├── login.html      # Login page
│   ├── signup.html     # Signup page
│   ├── setup_2fa.html  # 2FA setup page
│   ├── dashboard.html  # User dashboard
│   └── view_ad.html    # Ad viewing page
└── ads.db             # SQLite database (created automatically)
```

## Notes

⚠️ **Important**: This is a demonstration application. In production:
- Use HTTPS (set `JWT_COOKIE_SECURE = True`)
- Don't actually pay users for viewing ads (violates AdSense policies)
- Implement proper ad network integration
- Add withdrawal system with verification
- Use a production database (PostgreSQL, MySQL)

## License

MIT License - Feel free to use for educational purposes
