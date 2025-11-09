# 🚀 Quick Start Guide

## Installation & Running

1. **Install dependencies** (if not already done):
   ```bash
   npm install
   ```

2. **Start the development server**:
   ```bash
   npm run dev
   ```

3. **Open your browser**:
   - The app will be available at `http://localhost:5173`
   - Vite will automatically open it for you

## 🎯 Demo Credentials

### Admin Account
- **Email**: `admin@training.com`
- **Password**: `password123`
- **Access**: Full admin dashboard with all management features

### Trainee Account
- **Email**: `trainee@training.com`
- **Password**: `password123`
- **Access**: Trainee dashboard with progress tracking

## 📱 Features Overview

### ✅ Completed Modules

1. **Authentication** ✓
   - Login/Signup pages
   - Role-based access control
   - Password visibility toggle

2. **Dashboard** ✓
   - Admin view with stats and quick actions
   - Trainee view with progress tracking

3. **Module Management** ✓
   - Create/edit modules
   - Status tracking
   - Assignment management

4. **Attendance Tracking** ✓
   - Date and module filters
   - Status indicators
   - Statistics dashboard

5. **Assessments & Grades** ✓
   - Grade entry forms
   - Progress charts
   - Report generation

6. **Messaging** ✓
   - Inbox system
   - Message composer
   - Unread indicators

7. **Settings** ✓
   - Theme toggle (Light/Dark)
   - Notification preferences
   - Integration management

## 🎨 Design Features

- **Theme Toggle**: Click the theme button in sidebar or top-right on login
- **Color Scheme**: 
  - 🟠 Orange buttons for primary actions
  - 🟢 Green icons for status and actions
- **Responsive**: Works on mobile, tablet, and desktop

## 🛠️ Build for Production

```bash
npm run build
```

Output will be in the `dist/` folder.

## 📁 Project Structure

```
Bro/
├── src/
│   ├── components/        # Reusable components
│   │   ├── dashboard/     # Dashboard components
│   │   └── Layout.jsx     # Main layout
│   ├── contexts/          # React contexts
│   │   ├── AuthContext.jsx
│   │   └── ThemeContext.jsx
│   ├── pages/             # Page components
│   │   ├── Login.jsx
│   │   ├── Signup.jsx
│   │   ├── Dashboard.jsx
│   │   ├── Modules.jsx
│   │   ├── Attendance.jsx
│   │   ├── Assessments.jsx
│   │   ├── Messaging.jsx
│   │   └── Settings.jsx
│   ├── App.jsx            # Main app with routing
│   ├── main.jsx           # Entry point
│   └── index.css          # Global styles
├── index.html
├── package.json
├── vite.config.js
└── README.md
```

## 🐛 Troubleshooting

### Port already in use?
Change the port in `vite.config.js` or use:
```bash
npm run dev -- --port 3000
```

### Dependencies issues?
Delete `node_modules` and `package-lock.json`, then:
```bash
npm install
```

## ✨ Next Steps

The application is fully functional with mock data. To connect to a real backend:

1. Update `AuthContext.jsx` to call your authentication API
2. Replace mock data in components with API calls
3. Add state management (Redux/Zustand) if needed
4. Implement real-time features with WebSockets
5. Add data persistence with a database

---

**Enjoy your Training Management System! 🎓**

