# Netlify Deployment Guide

## Prerequisites
- GitHub repository: https://github.com/Ephraimraxy/isac
- Netlify account (sign up at https://app.netlify.com)

## Deployment Steps

### Option 1: Deploy via Netlify Dashboard (Recommended)

1. **Go to Netlify Dashboard**
   - Visit https://app.netlify.com
   - Sign in or create an account

2. **Add New Site**
   - Click "Add new site" → "Import an existing project"
   - Choose "GitHub" and authorize Netlify
   - Select your repository: `Ephraimraxy/isac`

3. **Configure Build Settings**
   - Build command: `npm run build`
   - Publish directory: `dist`
   - (These are already configured in `netlify.toml`)

4. **Set Environment Variables**
   - Go to Site settings → Environment variables
   - Add the following variables (from your `.env` file):
     ```
     VITE_FIREBASE_API_KEY=your_api_key
     VITE_FIREBASE_AUTH_DOMAIN=your_auth_domain
     VITE_FIREBASE_PROJECT_ID=your_project_id
     VITE_FIREBASE_STORAGE_BUCKET=your_storage_bucket
     VITE_FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id
     VITE_FIREBASE_APP_ID=your_app_id
     VITE_FIREBASE_MEASUREMENT_ID=your_measurement_id
     VITE_ADMIN_EMAIL=your_admin_email
     VITE_ADMIN_PASSWORD=your_admin_password
     ```

5. **Deploy**
   - Click "Deploy site"
   - Wait for the build to complete
   - Your site will be live at `https://your-site-name.netlify.app`

### Option 2: Deploy via Netlify CLI

1. **Install Netlify CLI**
   ```bash
   npm install -g netlify-cli
   ```

2. **Login to Netlify**
   ```bash
   netlify login
   ```

3. **Initialize Site**
   ```bash
   netlify init
   ```
   - Follow the prompts to link your site

4. **Set Environment Variables**
   ```bash
   netlify env:set VITE_FIREBASE_API_KEY "your_api_key"
   netlify env:set VITE_FIREBASE_AUTH_DOMAIN "your_auth_domain"
   netlify env:set VITE_FIREBASE_PROJECT_ID "your_project_id"
   netlify env:set VITE_FIREBASE_STORAGE_BUCKET "your_storage_bucket"
   netlify env:set VITE_FIREBASE_MESSAGING_SENDER_ID "your_messaging_sender_id"
   netlify env:set VITE_FIREBASE_APP_ID "your_app_id"
   netlify env:set VITE_FIREBASE_MEASUREMENT_ID "your_measurement_id"
   netlify env:set VITE_ADMIN_EMAIL "your_admin_email"
   netlify env:set VITE_ADMIN_PASSWORD "your_admin_password"
   ```

5. **Deploy**
   ```bash
   netlify deploy --prod
   ```

## Post-Deployment Checklist

- [ ] Verify the site loads correctly
- [ ] Test authentication (login/signup)
- [ ] Test Firebase connection
- [ ] Verify environment variables are set correctly
- [ ] Check browser console for errors
- [ ] Test on mobile devices
- [ ] Update Firebase authorized domains (if needed)

## Firebase Configuration

After deployment, you may need to:
1. Add your Netlify domain to Firebase authorized domains:
   - Go to Firebase Console → Authentication → Settings
   - Add `https://your-site-name.netlify.app` to authorized domains

2. Update Firestore Security Rules (if needed)
   - Ensure rules allow requests from your Netlify domain

## Custom Domain (Optional)

1. Go to Site settings → Domain management
2. Click "Add custom domain"
3. Follow the instructions to configure DNS

## Continuous Deployment

Netlify automatically deploys when you push to your main branch on GitHub. Each push triggers a new build and deployment.

## Troubleshooting

### Build Fails
- Check build logs in Netlify dashboard
- Verify all environment variables are set
- Ensure `package.json` has correct build script

### Environment Variables Not Working
- Make sure variables start with `VITE_` prefix
- Redeploy after adding new variables
- Check variable names match exactly

### Firebase Errors
- Verify Firebase config in environment variables
- Check Firebase authorized domains
- Ensure Firestore security rules are configured

## Support

For issues, check:
- Netlify docs: https://docs.netlify.com
- Build logs in Netlify dashboard
- Browser console for runtime errors

