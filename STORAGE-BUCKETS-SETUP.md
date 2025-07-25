# 📁 HalalCheck AI - Storage Buckets Setup

## **Quick Setup (2 minutes)**

1. Go to your Supabase dashboard: https://supabase.com/dashboard/project/pllewdnptglldpkuexxt
2. Click **SQL Editor**
3. Copy and paste the contents of `supabase-storage-setup.sql`
4. Click **Run**

## **What This Creates**

### **File Storage Buckets:**
- **halalcheck-files** - User uploaded files (private)
- **halalcheck-reports** - Generated PDF reports (private) 
- **halalcheck-avatars** - Profile pictures (public)

### **Security Policies:**
- Users can only access their own files
- Automatic folder organization by user ID
- File type and size restrictions

## **File After Setup:**

Your test will show "3 buckets" instead of "0 buckets" when you run:
```bash
node test-supabase.js
```

## **Optional: Verify in Dashboard**

After running the SQL:
1. Go to **Storage** in your Supabase dashboard
2. You should see the 3 buckets listed
3. Try uploading a test file to verify permissions

---

**Note**: This is optional for initial development but recommended for file upload features.