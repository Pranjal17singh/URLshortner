# 🔗 Lead Generation URL Shortener

A modern, full-stack URL shortener application with advanced lead generation capabilities, form builder, analytics, and Google OAuth authentication.

## ✨ Features

### 🚀 Core Features
- **URL Shortening**: Create short, memorable links with optional custom aliases
- **Lead Generation**: Capture leads with custom forms before redirecting
- **Form Builder**: Drag & drop form builder with live preview
- **Analytics Dashboard**: Comprehensive analytics with user responses and CSV export
- **5 Beautiful Themes**: Professional form styling (Ocean Breeze, Midnight Galaxy, Sunrise Bloom, Electric Dreams, Forest Mystique)

### 🔐 Authentication
- **Traditional Auth**: Email/password registration and login
- **Google OAuth**: One-click sign-in with Google
- **JWT Tokens**: Secure session management

### 📊 Analytics & Data
- **Click Tracking**: Real-time click counting and analytics
- **Form Responses**: Capture and analyze user submissions
- **CSV Export**: Download submission data for external analysis
- **User Dashboard**: Comprehensive analytics and management interface

### 🎨 Form Builder
- **Drag & Drop**: Modern drag-and-drop interface using @dnd-kit
- **Live Preview**: Real-time form preview with theme switching
- **Field Types**: Text, Email, Textarea, Dropdown, Checkbox
- **Theme System**: 5 professional themes with live preview
- **Responsive Design**: Mobile-friendly forms and interface

## 🛠️ Technology Stack

### Frontend
- **React 18** - Modern React with hooks
- **Vite** - Fast build tool and development server
- **Tailwind CSS** - Utility-first CSS framework
- **React Router** - Client-side routing
- **Axios** - HTTP client for API calls
- **React Hot Toast** - Beautiful notifications
- **@dnd-kit** - Modern drag and drop for React
- **Lucide React** - Beautiful icons

### Backend
- **Node.js** - JavaScript runtime
- **Express.js** - Web framework
- **Sequelize** - Modern ORM with migrations
- **SQLite** (development) / **PostgreSQL** (production via Supabase)
- **Passport.js** - Authentication middleware
- **JWT** - JSON Web Tokens for auth
- **BCrypt** - Password hashing
- **Nanoid** - URL-safe unique ID generator

### Database & Deployment
- **SQLite** - Local development database
- **Supabase PostgreSQL** - Production database
- **Vercel** - Deployment platform (both frontend and backend)
- **Google OAuth** - Social authentication

## 🚀 Quick Start

### Prerequisites
- Node.js 16+ 
- npm or yarn
- Git

### 1. Clone the Repository
\`\`\`bash
git clone https://github.com/Pranjal17singh/URLshortner.git
cd URLshortner
\`\`\`

### 2. Install Dependencies
\`\`\`bash
# Install backend dependencies
cd backend
npm install

# Install frontend dependencies
cd ../frontend
npm install
\`\`\`

### 3. Environment Setup

#### Backend Environment (\`backend/.env\`)
\`\`\`env
NODE_ENV=development
PORT=5000
JWT_SECRET=your-super-secure-jwt-secret-key-here
FRONTEND_URL=http://localhost:3000
BASE_URL=http://localhost:5000
SESSION_SECRET=your-session-secret-key-here

# Google OAuth (optional for development)
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
GOOGLE_CALLBACK_URL=http://localhost:5000/api/auth/google/callback
\`\`\`

#### Frontend Environment (\`frontend/.env\`)
\`\`\`env
VITE_API_URL=http://localhost:5000/api
\`\`\`

### 4. Run the Application
\`\`\`bash
# Start backend (from backend directory)
npm start

# Start frontend (from frontend directory, in another terminal)
npm run dev
\`\`\`

Visit [http://localhost:3000](http://localhost:3000) to see the application!

## 🔧 Google OAuth Setup (Optional)

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Create a new project or select existing one
3. Enable Google+ API or Google Identity API
4. Create OAuth 2.0 credentials:
   - **Authorized JavaScript origins**: \`http://localhost:5000\`, \`http://localhost:3000\`
   - **Authorized redirect URIs**: \`http://localhost:5000/api/auth/google/callback\`
5. Copy Client ID and Client Secret to your \`.env\` file

## 📁 Project Structure

\`\`\`
URLshortner/
├── backend/                 # Node.js/Express backend
│   ├── config/             # Database and passport configuration
│   ├── middleware/         # Authentication and validation middleware
│   ├── models/            # Sequelize database models
│   ├── routes/            # API route handlers
│   ├── shared/            # Shared resources (themes, etc.)
│   ├── .env.example       # Environment variables template
│   ├── package.json       # Backend dependencies
│   ├── server.js          # Main server file
│   └── vercel.json        # Vercel deployment config
├── frontend/               # React frontend
│   ├── public/            # Static assets
│   ├── src/
│   │   ├── components/    # Reusable React components
│   │   ├── contexts/      # React context providers
│   │   ├── pages/         # Page components
│   │   ├── utils/         # Utility functions and API client
│   │   ├── App.jsx        # Main App component
│   │   └── main.jsx       # React entry point
│   ├── .env.example       # Frontend environment template
│   ├── package.json       # Frontend dependencies
│   └── vite.config.js     # Vite configuration
├── shared/                 # Shared resources between frontend and backend
├── DEPLOYMENT.md          # Detailed deployment guide
├── README.md              # This file
└── .gitignore            # Git ignore rules
\`\`\`

## 🚀 Deployment

See [DEPLOYMENT.md](./DEPLOYMENT.md) for detailed deployment instructions to Vercel with Supabase.

### Quick Deployment Steps:
1. **Supabase**: Create project and get database URL
2. **Google OAuth**: Set up production OAuth credentials  
3. **Vercel Backend**: Deploy backend with environment variables
4. **Vercel Frontend**: Deploy frontend with API URL
5. **Test**: Verify all functionality works in production

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (\`git checkout -b feature/AmazingFeature\`)
3. Commit your changes (\`git commit -m 'Add some AmazingFeature'\`)
4. Push to the branch (\`git push origin feature/AmazingFeature\`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Built with modern web technologies
- Inspired by the need for better lead generation tools
- Thanks to the open-source community for amazing libraries

## 📞 Support

If you have any questions or need help, please open an issue on GitHub.

---

**Made with ❤️ by [Pranjal Singh](https://github.com/Pranjal17singh)**