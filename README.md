# Training Management System

A comprehensive, responsive web application for managing training programs, trainees, attendance, assessments, and communications.

## Features

### 🔐 Authentication Module
- Login and Signup functionality
- Role-based access control (Admin vs Trainee)
- Password visibility toggle with green icons
- Form validation and error handling

### 📊 Dashboard
- **Admin View**: Overview cards showing total trainees, active modules, and attendance rate. Quick action buttons for common tasks.
- **Trainee View**: Personalized progress tracker, upcoming sessions, and assessment summary.

### 📚 Module Management
- Create, view, and manage training modules
- Status badges (In Progress, Completed)
- Module assignment tracking
- Responsive table layout

### ✅ Attendance Tracking
- Mark and view attendance records
- Filter by date and module
- Calendar view with attendance statistics
- Status indicators (Present, Absent, Late)

### 📝 Assessment & Grades
- Enter and view grades
- Progress tracking with visual charts
- Downloadable reports
- Grade history and statistics

### 💬 Messaging & Notifications
- Send messages to trainees or groups
- Inbox with unread indicators
- Message composer with rich formatting
- Notification settings

### ⚙️ Settings & Integrations
- Theme toggle (Light/Dark mode)
- Notification preferences
- Email platform integration
- Calendar sync settings
- Permission management

## Design Features

- **Theme Toggle**: Seamless switching between light and dark themes
- **Color Scheme**: 
  - Orange (#ff6b35) for primary buttons
  - Green (#4caf50) for icons and status indicators
- **Responsive Design**: Fully optimized for mobile and desktop devices
- **Accessibility**: Well-sized, readable text across all screen sizes

## Getting Started

### Prerequisites
- Node.js (v16 or higher)
- npm or yarn

### Installation

1. Install dependencies:
```bash
npm install
```

2. Start the development server:
```bash
npm run dev
```

3. Open your browser and navigate to `http://localhost:5173`

### Build for Production

```bash
npm run build
```

The built files will be in the `dist` directory.

## Demo Credentials

### Admin Account
- Email: `admin@training.com`
- Password: `password123`

### Trainee Account
- Email: `trainee@training.com`
- Password: `password123`

## Project Structure

```
src/
├── components/          # Reusable components
│   ├── dashboard/       # Dashboard-specific components
│   └── Layout.jsx       # Main layout component
├── contexts/            # React contexts (Theme, Auth)
├── pages/               # Page components
│   ├── Login.jsx
│   ├── Signup.jsx
│   ├── Dashboard.jsx
│   ├── Modules.jsx
│   ├── Attendance.jsx
│   ├── Assessments.jsx
│   ├── Messaging.jsx
│   └── Settings.jsx
├── App.jsx             # Main app component with routing
├── main.jsx            # Entry point
└── index.css           # Global styles
```

## Technologies Used

- **React 18** - UI library
- **React Router** - Routing
- **Vite** - Build tool and dev server
- **CSS** - Styling with CSS variables for theming

## Browser Support

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)

## License

MIT

