# 🔐 HalalCheck AI - Google OAuth Setup Guide

## **Step 1: Create Google Cloud Project**

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Click "Select a project" → "New Project"
3. Project details:
   - **Project name**: `HalalCheck AI`
   - **Organization**: Your personal/business account
   - Click "Create"

## **Step 2: Enable Google+ API**

1. In your new project, go to **APIs & Services** → **Library**
2. Search for "Google+ API" 
3. Click on it and press **"Enable"**
4. Also enable "Google Identity" if available

## **Step 3: Configure OAuth Consent Screen**

1. Go to **APIs & Services** → **OAuth consent screen**
2. Choose **"External"** (unless you have a Google Workspace account)
3. Fill out the required fields:
   - **App name**: `HalalCheck AI`
   - **User support email**: Your email
   - **App logo**: Upload your logo (optional)
   - **App domain**: `halalcheck.eu` (or your domain)
   - **Authorized domains**: Add `supabase.co` and your domain
   - **Developer contact**: Your email
4. Click **"Save and Continue"**
5. **Scopes**: Just use the default scopes for now
6. **Test users**: Add your email for testing

## **Step 4: Create OAuth 2.0 Credentials**

1. Go to **APIs & Services** → **Credentials**
2. Click **"+ Create Credentials"** → **"OAuth 2.0 Client IDs"**
3. Application type: **"Web application"**
4. Name: `HalalCheck AI - Supabase Auth`
5. **Authorized redirect URIs** - Add these:
   ```
   https://pllewdnptglldpkuexxt.supabase.co/auth/v1/callback
   http://localhost:3000/auth/callback
   ```

6. Click **"Create"**

## **Step 5: Copy Your Credentials**

You'll get a popup with:
- **Client ID**: `123456789-abcdefg.apps.googleusercontent.com`
- **Client Secret**: `GOCSPX-abc123xyz789`

**Keep these safe!** You'll need them for Supabase.

## **Step 6: Configure in Supabase**

1. Go to your Supabase dashboard: https://pllewdnptglldpkuexxt.supabase.co
2. **Authentication** → **Providers**
3. Find **Google** and toggle it ON
4. Paste your credentials:
   - **Client ID**: From Google Cloud Console
   - **Client Secret**: From Google Cloud Console
5. Click **"Save"**

## **Step 7: Update Your Redirect URLs**

In Supabase **Authentication** → **URL Configuration**:
- **Site URL**: `http://localhost:3000` (development)
- **Redirect URLs**: Add:
  ```
  http://localhost:3000/auth/callback
  http://localhost:3000/auth/confirm
  https://yourdomain.com/auth/callback (for production)
  ```

## **Step 8: Test Google Sign-In**

Use the test file we created: `test-google-auth.html`

1. Update the credentials in the file:
   ```javascript
   const SUPABASE_URL = 'https://pllewdnptglldpkuexxt.supabase.co'
   const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBsbGV3ZG5wdGdsbGRwa3VleHh0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTMyODE2NjksImV4cCI6MjA2ODg1NzY2OX0.5L6wuNlK0qTYNXClxqGfaSWfl87sHmgNKpDOe-DkY9g'
   ```

2. Open the HTML file in your browser
3. Click "Sign in with Google"
4. Verify it works

## **Production Considerations**

When you go live, update:

1. **Google Cloud Console**:
   - Add your production domain to authorized domains
   - Update redirect URIs to use your real domain

2. **Supabase**:
   - Update Site URL to your production domain
   - Add production redirect URLs

## **🔐 Security Notes**

- ✅ **Client Secret**: Keep this secret, never expose in frontend code
- ✅ **Authorized Domains**: Only add domains you control
- ✅ **Redirect URIs**: Must match exactly what you configure in Supabase
- ✅ **HTTPS Required**: Google OAuth requires HTTPS in production

## **Your Current Supabase Info**

- **Project URL**: https://pllewdnptglldpkuexxt.supabase.co
- **Anon Key**: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBsbGV3ZG5wdGdsbGRwa3VleHh0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTMyODE2NjksImV4cCI6MjA2ODg1NzY2OX0.5L6wuNlK0qTYNXClxqGfaSWfl87sHmgNKpDOe-DkY9g
- **Dashboard**: https://supabase.com/dashboard/project/pllewdnptglldpkuexxt

---

**Note**: You can set this up anytime. Email/password authentication will work fine for initial development and testing.