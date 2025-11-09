# Quick Fix: Create .env File

## The Error
You're seeing: `Missing Firebase configuration. Please check your .env file`

This is because the `.env` file doesn't exist yet. Here's how to fix it:

## Solution: Create `.env` File

### Option 1: Manual Creation (Recommended)

1. **Create a new file** named `.env` in the root directory of your project:
   - Location: `C:\Users\user\Downloads\Bro\.env`

2. **Copy and paste this exact content** into the file:

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
VITE_ADMIN_EMAIL=hoseaephraim50@gmail.com
VITE_ADMIN_PASSWORD=335533
```

3. **Save the file**

4. **Restart your development server**:
   ```bash
   # Stop the current server (Ctrl+C)
   # Then restart:
   npm run dev
   ```

### Option 2: Using PowerShell

Run this command in PowerShell from your project root:

```powershell
@"
# Firebase Configuration
VITE_FIREBASE_API_KEY=AIzaSyCdexxefCbppelt2QvEK0SQ1Eay2fa6K2g
VITE_FIREBASE_AUTH_DOMAIN=trms-34e12.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=trms-34e12
VITE_FIREBASE_STORAGE_BUCKET=trms-34e12.firebasestorage.app
VITE_FIREBASE_MESSAGING_SENDER_ID=611375232559
VITE_FIREBASE_APP_ID=1:611375232559:web:8c78e41a71b906869238da
VITE_FIREBASE_MEASUREMENT_ID=G-X84SXE8MJH

# Admin Credentials
VITE_ADMIN_EMAIL=hoseaephraim50@gmail.com
VITE_ADMIN_PASSWORD=335533
"@ | Out-File -FilePath .env -Encoding utf8
```

### Option 3: Using Command Prompt

```cmd
cd C:\Users\user\Downloads\Bro
(
echo # Firebase Configuration
echo VITE_FIREBASE_API_KEY=AIzaSyCdexxefCbppelt2QvEK0SQ1Eay2fa6K2g
echo VITE_FIREBASE_AUTH_DOMAIN=trms-34e12.firebaseapp.com
echo VITE_FIREBASE_PROJECT_ID=trms-34e12
echo VITE_FIREBASE_STORAGE_BUCKET=trms-34e12.firebasestorage.app
echo VITE_FIREBASE_MESSAGING_SENDER_ID=611375232559
echo VITE_FIREBASE_APP_ID=1:611375232559:web:8c78e41a71b906869238da
echo VITE_FIREBASE_MEASUREMENT_ID=G-X84SXE8MJH
echo.
echo # Admin Credentials
echo VITE_ADMIN_EMAIL=hoseaephraim50@gmail.com
echo VITE_ADMIN_PASSWORD=335533
) > .env
```

## ✅ After Creating .env

1. **Restart your dev server** (important!)
   - Stop the current server (Ctrl+C in terminal)
   - Run `npm run dev` again

2. **Verify it works**:
   - The error should disappear
   - The app should load normally

## 🔍 Verify .env File

Make sure:
- ✅ File is named exactly `.env` (not `.env.txt` or `env`)
- ✅ File is in the root directory (same folder as `package.json`)
- ✅ No extra spaces or quotes around the values
- ✅ All variables start with `VITE_`

## 🚨 Common Issues

### File not found after creation
- Make sure you're in the project root directory
- Check if the file was created (it might be hidden - enable "Show hidden files" in Windows)

### Still getting error after creating .env
- **Restart the dev server** - Vite only reads .env on startup
- Check for typos in variable names
- Make sure there are no spaces around the `=` sign

### File shows as `.env.txt`
- Windows might add `.txt` extension
- Rename it to just `.env` (remove `.txt`)

