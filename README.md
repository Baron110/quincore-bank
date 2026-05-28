# 🏦 QuinCore Bank

A full-featured online banking web application built with React + Material UI + Firebase.

---

## 📁 File Reference

| File | Purpose |
|---|---|
| `src/firebaseConfig.js` | Firebase init — **add your credentials here** |
| `src/QuincoreSignUp.jsx` | 4-step registration with country/currency/deposit |
| `src/QuincoreSignIn.jsx` | Email/password login with password reset |
| `src/QuincoreDashboard.jsx` | Full banking dashboard |
| `src/App.jsx` | Routing + MUI theme |
| `src/index.js` | React entry point |
| `public/index.html` | HTML shell with DM Sans font |
| `package.json` | Dependencies + deploy scripts |

---

## 🚀 Quick Start

### 1. Create React App scaffold
```bash
npx create-react-app quincore-bank
cd quincore-bank
```

### 2. Replace `src/` and `public/` with these files

### 3. Install dependencies
```bash
npm install @mui/material @mui/icons-material @emotion/react @emotion/styled firebase react-router-dom react-chartjs-2 chart.js gh-pages
```

### 4. Set up Firebase

1. Go to [console.firebase.google.com](https://console.firebase.google.com)
2. Create a new project
3. Enable **Authentication → Email/Password**
4. Enable **Firestore Database** (start in test mode initially)
5. Copy your web app config into `src/firebaseConfig.js`

### 5. Run locally
```bash
npm start
```

---

## 🌐 Deploy to GitHub Pages

1. Update `homepage` in `package.json`:
   ```
   "homepage": "https://YOUR_GITHUB_USERNAME.github.io/quincore-bank"
   ```

2. Push to GitHub repo named `quincore-bank`

3. Deploy:
   ```bash
   npm run deploy
   ```

---

## 🔥 Firestore Security Rules (Recommended)

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
  }
}
```

---

## ✨ Features

- **Authentication**: Sign up / sign in / password reset via Firebase Auth
- **Multi-step Registration**: Personal info, contact, security, account setup
- **Real-time Balance**: Firestore `onSnapshot` updates instantly
- **Send Money**: Finds recipient by email, updates both balances
- **Deposit / Pay Bills / Request Money**: All persisted to Firestore
- **Virtual Card**: Tier-based card with CVV toggle
- **Transaction History**: Filterable, searchable table
- **Analytics**: 6-month spending line chart + category doughnut chart
- **Profile Management**: Edit name, phone, address
- **Responsive**: Works on mobile and desktop
- **Account Tiers**: Bronze / Silver / Gold / Platinum based on balance
