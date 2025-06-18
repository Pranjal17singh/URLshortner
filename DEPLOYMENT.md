# Deployment Guide

This guide will help you deploy the URL Shortener application to production using Supabase and Vercel.

## Prerequisites

1. **Supabase Account**: Sign up at [supabase.com](https://supabase.com)
2. **Vercel Account**: Sign up at [vercel.com](https://vercel.com)
3. **Google OAuth App**: Set up at [Google Cloud Console](https://console.cloud.google.com)

## Step 1: Set up Supabase Database

1. **Create a new Supabase project**:
   - Go to [supabase.com](https://supabase.com)
   - Click "New Project"
   - Choose your organization
   - Enter project name and database password
   - Select region (closest to your users)

2. **Get your database credentials**:
   - Go to Settings → Database
   - Copy the connection string (it looks like: `postgresql://postgres:[password]@db.[project-ref].supabase.co:5432/postgres`)
   - Also note your project URL and anon key from Settings → API

3. **Set up database tables** (Supabase will auto-create them when you first run the app with DATABASE_URL set)

## Step 2: Set up Google OAuth

1. **Go to Google Cloud Console**:
   - Visit [console.cloud.google.com](https://console.cloud.google.com)
   - Create a new project or select existing one

2. **Enable Google+ API**:
   - Go to APIs & Services → Library
   - Search for "Google+ API" and enable it

3. **Create OAuth credentials**:
   - Go to APIs & Services → Credentials
   - Click "Create Credentials" → "OAuth 2.0 Client IDs"
   - Choose "Web application"
   - Add authorized origins:
     - `http://localhost:5000` (for development)
     - `https://your-backend-domain.vercel.app` (for production)
   - Add authorized redirect URIs:
     - `http://localhost:5000/api/auth/google/callback` (for development)
     - `https://your-backend-domain.vercel.app/api/auth/google/callback` (for production)

4. **Copy your Client ID and Client Secret**

## Step 3: Deploy Backend to Vercel

1. **Push your code to GitHub**:
   ```bash
   git add .
   git commit -m "Add Supabase and OAuth support"
   git push origin main
   ```

2. **Deploy to Vercel**:
   - Go to [vercel.com](https://vercel.com)
   - Click "New Project"
   - Import your GitHub repository
   - Select the `backend` folder as the root directory
   - Add environment variables in Vercel dashboard:

   ```
   NODE_ENV=production
   JWT_SECRET=your-super-secure-jwt-secret-key-here
   SESSION_SECRET=your-session-secret-key-here
   GOOGLE_CLIENT_ID=your-google-client-id
   GOOGLE_CLIENT_SECRET=your-google-client-secret
   GOOGLE_CALLBACK_URL=https://your-backend-domain.vercel.app/api/auth/google/callback
   SUPABASE_URL=https://your-project.supabase.co
   SUPABASE_ANON_KEY=your-supabase-anon-key
   DATABASE_URL=postgresql://postgres:[password]@db.[project-ref].supabase.co:5432/postgres
   FRONTEND_URL=https://your-frontend-domain.vercel.app
   BASE_URL=https://your-backend-domain.vercel.app
   ```

3. **Deploy and test**

## Step 4: Deploy Frontend to Vercel

1. **Update frontend environment variables**:
   - Create/update `.env` in the frontend folder:
   ```
   VITE_API_URL=https://your-backend-domain.vercel.app/api
   ```

2. **Deploy frontend to Vercel**:
   - Go to [vercel.com](https://vercel.com)
   - Click "New Project"
   - Import your GitHub repository again
   - Select the `frontend` folder as the root directory
   - Add environment variables:
   ```
   VITE_API_URL=https://your-backend-domain.vercel.app/api
   ```

3. **Deploy and test**

## Step 5: Update OAuth Settings

1. **Update Google OAuth settings**:
   - Go back to Google Cloud Console
   - Update your OAuth app settings with the production URLs:
     - Authorized origins: Add `https://your-frontend-domain.vercel.app`
     - Redirect URIs: Update to use your production backend URL

2. **Update Vercel environment variables**:
   - Update `FRONTEND_URL` in backend to point to your production frontend
   - Update `GOOGLE_CALLBACK_URL` to use your production backend URL

## Step 6: Test Your Deployment

1. **Test basic functionality**:
   - Visit your frontend URL
   - Try creating an account
   - Test Google OAuth login
   - Create a short URL
   - Test form builder
   - Test analytics

2. **Check database**:
   - Go to Supabase dashboard
   - Check that tables are created and data is being stored

## Troubleshooting

### Common Issues:

1. **Database connection errors**:
   - Verify your DATABASE_URL is correct
   - Check Supabase project is active
   - Ensure SSL is enabled

2. **OAuth errors**:
   - Verify Google OAuth credentials
   - Check authorized origins and redirect URIs
   - Ensure FRONTEND_URL and GOOGLE_CALLBACK_URL are correct

3. **CORS errors**:
   - Verify FRONTEND_URL is set correctly in backend
   - Check that frontend is making requests to correct API URL

4. **Environment variable issues**:
   - Verify all required environment variables are set in Vercel
   - Check for typos in variable names
   - Ensure no spaces around = in environment variables

## Optional: Custom Domain

1. **Add custom domain in Vercel**:
   - Go to your project settings in Vercel
   - Add your custom domain
   - Update DNS records as instructed

2. **Update OAuth and environment variables**:
   - Update Google OAuth settings with custom domain
   - Update environment variables to use custom domain

## Security Notes

1. **Environment Variables**: Never commit real environment variables to git
2. **JWT Secret**: Use a strong, unique JWT secret for production
3. **Database**: Supabase handles security, but review their security settings
4. **OAuth**: Keep your Google OAuth credentials secure

## Monitoring

1. **Vercel Analytics**: Enable in Vercel dashboard for performance monitoring
2. **Supabase Dashboard**: Monitor database performance and usage
3. **Error Tracking**: Consider adding Sentry or similar for error tracking

Your URL Shortener should now be fully deployed and ready for production use!