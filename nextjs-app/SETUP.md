# 🚀 Quick Start Guide - Noodle LMS (Next.js)

## Prerequisites Check

Before starting, ensure you have:
- ✅ Node.js 18+ (`node --version`)
- ✅ npm or pnpm package manager
- ✅ Git installed
- ✅ A web browser
- ✅ Text editor (VS Code recommended)

## Step-by-Step Setup (15 minutes)

### Step 1: Set Up Supabase (5 minutes)

1. **Create Account**: Go to https://supabase.com and sign up
2. **Create Project**:
   - Click "New Project"
   - Choose organization
   - Enter project name: `noodle-lms`
   - Set database password (save it!)
   - Choose region (closest to you)
   - Click "Create new project"
   - Wait 2-3 minutes for provisioning

3. **Get API Credentials**:
   - Go to Project Settings (gear icon) > API
   - Copy `Project URL` → This is your `NEXT_PUBLIC_SUPABASE_URL`
   - Copy `anon public` key → This is your `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - Copy `service_role secret` → This is your `SUPABASE_SERVICE_ROLE_KEY`

4. **Set Up Database**:
   - Click on "SQL Editor" in left sidebar
   - Click "New Query"
   - Open `supabase-schema.sql` from this project
   - Copy ALL contents
   - Paste into SQL Editor
   - Click "Run" button
   - You should see "Success. No rows returned"

5. **Run Additional Setup**:
   - Create a new query in SQL Editor
   - Open `supabase-updates.sql` from this project
   - Copy ALL contents
   - Paste into SQL Editor
   - Click "Run" button
   - This will:
     - Add proper RLS policies
     - Create storage bucket for course images
     - Add sample courses
     - Create helper function to make users admin

6. **Set Up Storage**:
   - Go to Storage in Supabase dashboard
   - If 'course-images' bucket doesn't exist, create it:
     - Click "New bucket"
     - Name: `course-images`
     - Check "Public bucket"
     - Click "Create bucket"

### Step 2: Set Up Google OAuth (5 minutes)

1. **Google Cloud Console**:
   - Go to https://console.cloud.google.com
   - Create new project or select existing
   - In search bar, type "OAuth consent screen"
   - Fill in required fields:
     - App name: "Noodle LMS"
     - User support email: your email
     - Developer contact: your email
   - Save and Continue
   - Add scopes: `./auth/userinfo.email` and `./auth/userinfo.profile`
   - Save

2. **Create OAuth Credentials**:
   - Go to Credentials > Create Credentials > OAuth 2.0 Client ID
   - Application type: Web application
   - Name: "Noodle LMS Web Client"
   - Authorized redirect URIs:
     - Add: `http://localhost:3000/auth/callback`
     - Add: `https://[YOUR-SUPABASE-PROJECT-ID].supabase.co/auth/v1/callback`
   - Click Create
   - **SAVE** Client ID and Client Secret!

3. **Configure Supabase**:
   - In Supabase dashboard, go to Authentication > Providers
   - Find "Google" and enable it
   - Paste your Google Client ID
   - Paste your Google Client Secret  
   - Click Save

### Step 3: Configure Environment Variables (2 minutes)

1. In the `nextjs-app` directory, copy the example file:
   ```bash
   cp .env.example .env.local
   ```

2. Edit `.env.local` and fill in ALL values:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
   SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
   
   GOOGLE_CLIENT_ID=your-google-client-id.apps.googleusercontent.com
   GOOGLE_CLIENT_SECRET=your-google-client-secret
   
   NEXT_PUBLIC_APP_URL=http://localhost:3000
   NEXTAUTH_URL=http://localhost:3000
   NEXTAUTH_SECRET=run-openssl-rand-base64-32-to-generate
   
   ALLOWED_EMAIL_DOMAIN=bits-pilani.ac.in
   ```

3. Generate NEXTAUTH_SECRET:
   ```bash
   openssl rand -base64 32
   ```
   Copy the output and paste as `NEXTAUTH_SECRET`

### Step 4: Install & Run (3 minutes)

1. **Install dependencies**:
   ```bash
   cd nextjs-app
   npm install
   ```

2. **Start development server**:
   ```bash
   npm run dev
   ```

3. **Open browser**:
   - Go to http://localhost:3000
   - You should see the Noodle homepage!

### Step 5: Create First Admin User

**Option A - Using SQL Function (Recommended)**:

1. First, sign in with Google using your email
2. Go to Supabase Dashboard > SQL Editor
3. Run this query:
   ```sql
   SELECT make_user_admin('your-email@domain.com');
   ```
   Replace with your actual email address.

4. Refresh your browser - you should now see "Admin" link in navbar!

**Option B - Manual Update**:

1. Click "Sign In" and authenticate with Google
2. After signing in, go to Supabase dashboard
3. Go to Table Editor > `users` table
4. Find your user row
5. Click on the `role` cell
6. Change from `student` to `admin`
7. Save
8. Refresh your browser
9. You should now see "Admin" link in navbar!

**For f20230621@goa.bits-pilani.ac.in**:
```sql
SELECT make_user_admin('f20230621@goa.bits-pilani.ac.in');
```

## Testing the Setup

### Test Student Features:
1. Browse catalog: http://localhost:3000/catalog
2. Sign in with Google (BITS email)
3. View dashboard: http://localhost:3000/dashboard
4. (Will be empty until admin creates courses)

### Test Admin Features (after making yourself admin):
1. Go to http://localhost:3000/admin
2. Create a new course
3. Add course pages (articles, quizzes)
4. Create questions
5. View as student

## Common Issues & Solutions

### ❌ "Database error" on startup
**Solution**: Make sure you ran the entire `supabase-schema.sql` in Supabase SQL Editor

### ❌ "Authentication failed"
**Solution**: 
- Verify Google OAuth redirect URI exactly matches
- Check that Google provider is enabled in Supabase
- Ensure environment variables are set correctly

### ❌ "Not authorized" when accessing admin
**Solution**: Make sure you changed your user's `role` to `admin` in Supabase

### ❌ Build errors
**Solution**: 
```bash
rm -rf node_modules package-lock.json
npm install
```

### ❌ Google Sign-In shows domain error
**Solution**: Update `ALLOWED_EMAIL_DOMAIN` in `.env.local` or remove domain restriction in code

## Next Steps

1. **Create Sample Data**:
   - Create a few courses as admin
   - Add some articles and quizzes
   - Test registration flow

2. **Customize**:
   - Update branding in `components/NavBar.tsx`
   - Modify email domain restriction if needed
   - Add your institution's logo

3. **Deploy to Vercel** (see README.md for full instructions):
   ```bash
   # Push to GitHub
   git add .
   git commit -m "Initial setup"
   git push

   # Then deploy on vercel.com
   ```

## File Structure Overview

```
nextjs-app/
├── .env.local              # Your secrets (NEVER commit!)
├── .env.example            # Template for environment variables
├── supabase-schema.sql     # Database schema - run in Supabase
├── app/                    # All pages and API routes
│   ├── api/               # Backend endpoints
│   ├── dashboard/         # Student dashboard
│   ├── catalog/           # Course catalog
│   ├── admin/             # Admin panel
│   └── login/             # Login page
├── components/            # Reusable UI components
├── lib/                   # Utilities and helpers
└── types/                 # TypeScript definitions
```

## Development Workflow

1. **Make changes** to code
2. **Save file** (hot reload is automatic)
3. **Check browser** for updates
4. **Check terminal** for errors
5. **Commit changes** regularly

## Getting Help

- Check `README.md` for detailed documentation
- Review Next.js docs: https://nextjs.org/docs
- Review Supabase docs: https://supabase.com/docs
- Check original repo: https://github.com/samarsault/noodle

## Success Checklist

- [ ] Supabase project created and schema imported
- [ ] Google OAuth configured and working
- [ ] Environment variables all set in `.env.local`
- [ ] Dependencies installed (`node_modules/` exists)
- [ ] Dev server runs without errors
- [ ] Can access homepage at localhost:3000
- [ ] Can sign in with Google
- [ ] First user made admin in database
- [ ] Admin panel accessible

**You're all set! 🎉 Start creating courses and building your LMS!**
