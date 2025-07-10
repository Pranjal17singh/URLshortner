# URL Shortener - Lead Generation Platform

A production-ready URL shortener with lead generation forms and analytics.

## 🚀 Features

- **URL Shortening**: Create short, memorable links with custom codes
- **Lead Generation**: Capture leads with custom forms before redirecting
- **Form Builder**: Dynamic form creation with templates
- **Analytics**: Real-time click tracking and conversion metrics
- **Authentication**: Secure Supabase Auth integration
- **Production Ready**: Clean architecture with security & performance

## 🛠️ Technology Stack

### Frontend
- **React 18** - Modern React with hooks
- **Vite** - Fast build tool and development server
- **Tailwind CSS** - Utility-first CSS framework
- **React Router** - Client-side routing
- **Axios** - HTTP client for API calls
- **React Hot Toast** - Beautiful notifications
- **Supabase Auth** - Authentication

### Backend
- **Node.js** - JavaScript runtime
- **Express.js** - Web framework
- **Supabase** - Database and authentication
- **PostgreSQL** - Production database
- **Helmet** - Security middleware
- **Morgan** - Request logging
- **Nanoid** - URL-safe unique ID generator

### Security & Performance
- **Input Validation** - Express-validator
- **Rate Limiting** - DDoS protection
- **Error Handling** - Structured error responses
- **CORS** - Cross-origin resource sharing
- **Sanitization** - XSS protection

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- Supabase account
- PostgreSQL (via Supabase)

### 1. Clone the Repository
```bash
git clone <your-repo>
cd URlShortner
```

### 2. Install Dependencies
```bash
# Install API dependencies
cd api
npm install

# Install frontend dependencies
cd ../frontend
npm install
```

### 3. Database Setup
- Create a Supabase project at [supabase.com](https://supabase.com)
- Run the SQL in `PRODUCTION_SCHEMA.sql` in your Supabase SQL Editor
- Copy your Supabase credentials

### 4. Environment Setup

#### API Environment (`api/.env`)
```env
NODE_ENV=development
PORT=3001
SUPABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
FRONTEND_URL=http://localhost:3000
JWT_SECRET=your-jwt-secret
```

#### Frontend Environment (`frontend/.env`)
```env
VITE_API_URL=http://localhost:3001/api
```

### 5. Run the Application
```bash
# Start API (from api directory)
npm run dev

# Start frontend (from frontend directory, in another terminal)
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000) to see the application!

## 🔧 API Endpoints

### Health Check
- `GET /health` - Server health status

### Authentication
- `GET /api/auth/me` - Get current user
- `PUT /api/auth/profile` - Update user profile

### URL Management
- `POST /api/urls` - Create short URL
- `GET /api/urls` - List user URLs
- `GET /api/urls/:id` - Get specific URL
- `PUT /api/urls/:id` - Update URL
- `DELETE /api/urls/:id` - Delete URL

### Forms
- `GET /api/forms` - List user forms
- `POST /api/forms` - Create form
- `GET /api/forms/templates` - Get form templates

### Analytics
- `GET /api/analytics/dashboard` - Dashboard stats
- `GET /api/analytics/urls/:id` - URL analytics

### URL Redirection
- `GET /:shortCode` - Redirect or show form
- `POST /submit/:shortCode` - Submit form data

## 📁 Project Structure

```
URlShortner/
├── api/                    # Backend API
│   ├── app.js             # Main application
│   ├── routes/            # API routes
│   │   └── index.js       # All API endpoints
│   ├── middleware/        # Security & validation
│   │   ├── auth.js        # Authentication middleware
│   │   ├── errorHandler.js # Error handling
│   │   ├── security.js    # Security middleware
│   │   └── validation.js  # Input validation
│   ├── config/            # Configuration
│   │   ├── env.js         # Environment config
│   │   └── supabase.js    # Database config
│   ├── utils/             # Utilities
│   │   └── logger.js      # Logging utility
│   ├── .env.example       # Environment template
│   └── package.json       # Dependencies
├── frontend/              # React frontend
│   ├── src/
│   │   ├── components/    # React components
│   │   ├── contexts/      # React contexts
│   │   ├── pages/         # Page components
│   │   ├── services/      # API services
│   │   └── utils/         # Utilities
│   ├── package.json       # Frontend dependencies
│   └── vite.config.js     # Vite configuration
├── PRODUCTION_SCHEMA.sql  # Database schema
└── README.md              # This file
```

## 🚀 Deployment

### Vercel (Recommended)
1. Connect your GitHub repository to Vercel
2. Set environment variables in Vercel dashboard
3. Deploy automatically on push

### Manual Deployment
```bash
# Build frontend
cd frontend
npm run build

# Start production server
cd ../api
npm start
```

### Environment Variables for Production
- `SUPABASE_URL` - Your Supabase project URL
- `SUPABASE_ANON_KEY` - Your Supabase anon key
- `SUPABASE_SERVICE_ROLE_KEY` - Your Supabase service role key
- `FRONTEND_URL` - Your frontend URL
- `JWT_SECRET` - Strong JWT secret
- `NODE_ENV=production`

## 🔒 Security Features

- Input validation and sanitization
- Rate limiting
- CSRF protection
- SQL injection prevention
- XSS protection
- Secure headers (Helmet.js)
- Row Level Security (RLS)

## 📊 Database Schema

The application uses these tables:
- `profiles` - User profiles
- `urls` - Shortened URLs
- `forms` - Lead generation forms
- `form_submissions` - Form submissions
- `analytics` - Click and event tracking

## 🐛 Troubleshooting

### Common Issues

1. **Database Connection Error**
   - Check Supabase credentials in `.env`
   - Verify database schema is created

2. **Port Already in Use**
   ```bash
   sudo lsof -ti:3001 | xargs kill -9
   ```

3. **CORS Issues**
   - Update `FRONTEND_URL` in environment variables

### Logs
- Development: Console output
- Production: `logs/app.log` and `logs/error.log`

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 📞 Support

If you have any questions or need help, please open an issue on GitHub.

---

**Made with ❤️ by [Pranjal Singh](https://github.com/Pranjal17singh)**