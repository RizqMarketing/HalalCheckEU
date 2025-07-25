# 🚀 HalalCheck AI - Supabase Setup Guide

## **Step 1: Create Supabase Project**

1. Go to [supabase.com](https://supabase.com) and sign up/login
2. Click "New Project"
3. Choose your organization or create one
4. Project settings:
   - **Name**: `HalalCheck AI`
   - **Database Password**: Generate a strong password (save it!)
   - **Region**: Choose closest to your users (Europe West for EU customers)
   - **Pricing Plan**: Start with Free tier (upgrade later)

## **Step 2: Configure Database Schema**

1. In your Supabase dashboard, go to **SQL Editor**
2. Copy the contents of `supabase-schema.sql`
3. Paste and run the SQL to create all tables and functions
4. Verify tables were created in **Table Editor**

## **Step 3: Set Up Storage Buckets**

1. In Supabase dashboard, go to **Storage**
2. Go to **SQL Editor** again
3. Copy contents of `supabase-storage-setup.sql`
4. Run the SQL to create storage buckets and policies
5. Verify buckets exist in **Storage** section

## **Step 4: Configure Authentication**

1. Go to **Authentication** → **Settings**
2. **Site URL**: Set to `http://localhost:3000` (change for production)
3. **Redirect URLs**: Add:
   - `http://localhost:3000/auth/callback`
   - `http://localhost:3000/auth/confirm`
   - `https://yourdomain.com/auth/callback` (for production)

4. **Email Templates**:
   - Customize the confirmation and reset password emails
   - Use your brand colors and messaging

5. **Providers**: Enable Email authentication (others optional)

## **Step 5: Get Your Keys**

1. Go to **Settings** → **API**
2. Copy these values:
   - **Project URL**: `https://your-project-id.supabase.co`
   - **Anon/Public Key**: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`
   - **Service Role Key**: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...` (keep secret!)

3. Update `.env.supabase` file with your actual values

## **Step 6: Configure Email (Optional but Recommended)**

1. Go to **Settings** → **Auth** → **SMTP Settings**
2. Configure with your email provider (Resend recommended):
   ```
   Host: smtp.resend.com
   Port: 587
   Username: resend
   Password: [your-resend-api-key]
   Sender: noreply@halalcheck.eu
   ```

## **Step 7: Set Up Row Level Security**

The schema already includes RLS policies, but verify:

1. Go to **Authentication** → **Policies**
2. Check that all tables have appropriate policies
3. Test with a dummy user account

## **Step 8: Test Connection**

Create a simple test to verify everything works:

```javascript
// test-supabase.js
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://your-project-id.supabase.co'
const supabaseKey = 'your-anon-key'
const supabase = createClient(supabaseUrl, supabaseKey)

async function testConnection() {
  const { data, error } = await supabase
    .from('user_profiles')
    .select('count(*)')
  
  if (error) {
    console.error('Connection failed:', error)
  } else {
    console.log('Connection successful!', data)
  }
}

testConnection()
```

## **Production Checklist**

Before going live:

- [ ] Change all localhost URLs to your domain
- [ ] Update CORS settings in Supabase
- [ ] Set up proper email sender domain
- [ ] Configure SSL certificates
- [ ] Set up database backups
- [ ] Configure monitoring and alerts
- [ ] Test all RLS policies with real users
- [ ] Set up staging environment

## **Security Best Practices**

1. **Never expose service role key** in frontend code
2. **Use environment variables** for all sensitive data
3. **Test RLS policies** thoroughly
4. **Enable 2FA** on your Supabase account
5. **Regular security audits** of your policies
6. **Monitor usage** for unusual patterns

## **Troubleshooting**

**Common Issues:**

1. **RLS blocking queries**: Check your policies match your auth setup
2. **Storage upload fails**: Verify bucket policies and file types
3. **Email not sending**: Check SMTP configuration and domain verification
4. **Connection timeout**: Check your database password and URL

**Support Resources:**

- [Supabase Documentation](https://supabase.com/docs)
- [Supabase Community](https://github.com/supabase/supabase/discussions)
- [Discord Community](https://discord.supabase.com/)

---

✅ **Your Supabase project is now ready for the Next.js integration!**