# Environment Variables Setup Guide

## 🔒 Security Fix Applied

The Firebase configuration and admin credentials have been moved to environment variables for better security.

## 📝 Setup Instructions

### Step 1: Create `.env` file

Create a `.env` file in the root directory of your project with the following content:

```env
# Firebase Configuration
VITE_FIREBASE_API_KEY=AIzaSyCdexxefCbppelt2QvEK0SQ1Eay2fa6K2g
VITE_FIREBASE_AUTH_DOMAIN=trms-34e12.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=trms-34e12
VITE_FIREBASE_STORAGE_BUCKET=trms-34e12.firebasestorage.app
VITE_FIREBASE_MESSAGING_SENDER_ID=611375232559
VITE_FIREBASE_APP_ID=1:611375232559:web:8c78e41a71b906869238da
VITE_FIREBASE_MEASUREMENT_ID=G-X84SXE8MJH

# Admin Credentials
# IMPORTANT: Change these values in production!
VITE_ADMIN_EMAIL=hoseaephraim50@gmail.com
VITE_ADMIN_PASSWORD=335533
```

### Step 2: Create `.env.example` file (for version control)

Create a `.env.example` file with placeholder values:

```env
# Firebase Configuration
# Copy this file to .env and fill in your actual values
# Get these values from your Firebase project settings

VITE_FIREBASE_API_KEY=your_api_key_here
VITE_FIREBASE_AUTH_DOMAIN=your_auth_domain_here
VITE_FIREBASE_PROJECT_ID=your_project_id_here
VITE_FIREBASE_STORAGE_BUCKET=your_storage_bucket_here
VITE_FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id_here
VITE_FIREBASE_APP_ID=your_app_id_here
VITE_FIREBASE_MEASUREMENT_ID=your_measurement_id_here

# Admin Credentials
# IMPORTANT: Change these values in production!
# The admin account should be created in Firebase Authentication console
VITE_ADMIN_EMAIL=your_admin_email@example.com
VITE_ADMIN_PASSWORD=your_secure_password_here
```

### Step 3: Restart Development Server

After creating the `.env` file, restart your development server:

```bash
npm run dev
```

## ✅ What Changed

1. **Firebase Config** (`src/firebase/config.js`):
   - Now reads from environment variables instead of hardcoded values
   - Includes validation to ensure all required variables are set

2. **Admin Credentials** (`src/contexts/AuthContext.jsx`):
   - Now reads from environment variables instead of hardcoded values
   - Includes warning if credentials are not configured

3. **`.gitignore`**:
   - Updated to exclude `.env` files from version control
   - Your sensitive data will not be committed to git

## 🔐 Security Best Practices

1. **Never commit `.env` file**: It's already added to `.gitignore`
2. **Use `.env.example`**: Commit this file with placeholder values
3. **Change default credentials**: Update admin email/password in production
4. **Rotate credentials**: Regularly update sensitive credentials
5. **Use different values for dev/prod**: Consider having separate `.env` files for different environments

## 🚨 Important Notes

- In Vite, environment variables must be prefixed with `VITE_` to be exposed to the client
- The `.env` file should be created manually (it's not tracked in git for security)
- If you see errors about missing environment variables, make sure your `.env` file exists and has all required variables

## 🐛 Troubleshooting

### Error: "Missing Firebase configuration"
- Make sure your `.env` file exists in the root directory
- Verify all `VITE_FIREBASE_*` variables are set
- Restart your development server after creating/updating `.env`

### Warning: "Admin credentials not configured"
- Set `VITE_ADMIN_EMAIL` and `VITE_ADMIN_PASSWORD` in your `.env` file
- Restart the development server

