// Suppress Firestore and OAuth console errors EARLY - before anything loads
if (typeof window !== 'undefined') {
  const originalConsoleError = console.error;
  const originalConsoleWarn = console.warn;
  const originalConsoleInfo = console.info;
  const originalConsoleLog = console.log;
  
  const suppressedPatterns = [
    'WebChannelConnection',
    'transport errored',
    '400 (Bad Request)',
    'RPC',
    'Listen',
    'Write',
    'stream',
    'transport',
    'ERR_ABORTED',
    'ERR_CONNECTION_RESET',
    'OAuth operations',
    'not authorized for OAuth',
    'Authorized domains',
    'iframe.js',
    'navigation:iframe.js',
    'firestore.googleapis.com',
    'Listen/channel',
    'gsessionid',
    'Bad Request',
    'net::ERR_ABORTED',
    'net::ERR_CONNECTION_RESET',
    'current domain is not authorized',
    'signInWithPopup',
    'signInWithRedirect',
    'linkWithPopup',
    'linkWithRedirect'
  ];
  
  const shouldSuppress = (message) => {
    if (!message) return false;
    const msg = typeof message === 'string' ? message : String(message);
    return suppressedPatterns.some(pattern => 
      msg.toLowerCase().includes(pattern.toLowerCase())
    );
  };
  
  // Override console.error
  console.error = (...args) => {
    const message = args.map(arg => String(arg)).join(' ');
    if (!shouldSuppress(message)) {
      originalConsoleError.apply(console, args);
    }
  };
  
  // Override console.warn
  console.warn = (...args) => {
    const message = args.map(arg => String(arg)).join(' ');
    if (!shouldSuppress(message)) {
      originalConsoleWarn.apply(console, args);
    }
  };
  
  // Override console.info
  console.info = (...args) => {
    const message = args.map(arg => String(arg)).join(' ');
    if (!shouldSuppress(message)) {
      originalConsoleInfo.apply(console, args);
    }
  };
  
  // Override console.log for Firestore errors
  console.log = (...args) => {
    const message = args.map(arg => String(arg)).join(' ');
    if (!shouldSuppress(message)) {
      originalConsoleLog.apply(console, args);
    }
  };
}

import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)

