# Noodle Learning Management System - Next.js Refactored Version

This is a complete refactoring of the original Vue.js + Express Noodle LMS into a modern Next.js 14+ application with Supabase backend.

## 🚀 Tech Stack

- **Frontend**: Next.js 14+ (App Router), React, TypeScript, Tailwind CSS
- **Backend**: Next.js API Routes (serverless functions)
- **Database**: Supabase (PostgreSQL)
- **Authentication**: Supabase Auth with Google OAuth
- **File Storage**: Supabase Storage (replacing AWS S3)
- **Hosting**: Vercel (optimized for deployment)

## 📋 Prerequisites

- Node.js 18+ installed
- A Supabase account (free tier available at [supabase.com](https://supabase.com))
- Google OAuth credentials
- BITS Pilani email domain access (or modify the domain restriction)

## 🛠️ Setup Instructions

### 1. Create Supabase Project

1. Go to [https://supabase.com](https://supabase.com) and create a new project
2. Wait for the project to be fully provisioned
3. Go to Project Settings > API to get your project URL and anon key

### 2. Set Up Database

1. In Supabase dashboard, go to SQL Editor
2. Copy the entire contents of `supabase-schema.sql`
3. Paste and run it in the SQL Editor
4. This will create all tables, indexes, RLS policies, and helper functions

### 3. Configure Google OAuth

#### In Google Cloud Console:

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Create a new project or select existing
3. Enable Google+ API
4. Go to Credentials > Create Credentials > OAuth 2.0 Client ID
5. Application type: Web application
6. Add authorized redirect URIs:
   - `http://localhost:3000/auth/callback` (for local development)
   - `https://your-domain.vercel.app/auth/callback` (for production)
7. Save and copy Client ID and Client Secret

#### In Supabase:

1. Go to Authentication > Providers
2. Enable Google provider
3. Enter your Google Client ID and Client Secret
4. Save

### 4. Environment Variables

1. Copy `.env.example` to `.env.local`:
   ```bash
   cp .env.example .env.local
   ```

2. Fill in the values in `.env.local`:

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here

# Google OAuth (from Google Cloud Console)
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret

# App Configuration
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXTAUTH_SECRET=generate-with-openssl-rand-base64-32
NEXTAUTH_URL=http://localhost:3000

# Email domain restriction
ALLOWED_EMAIL_DOMAIN=bits-pilani.ac.in
```

3. Generate `NEXTAUTH_SECRET`:
   ```bash
   openssl rand -base64 32
   ```

### 5. Install Dependencies

```bash
npm install
```

### 6. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## 🗂️ Project Structure

```
nextjs-app/
├── app/                          # Next.js app directory
│   ├── api/                      # API routes
│   │   ├── auth/                 # Authentication endpoints
│   │   ├── admin/                # Admin-only endpoints
│   │   ├── courses/              # Course-related endpoints
│   │   └── user/                 # User-related endpoints
│   ├── dashboard/                # Student dashboard
│   ├── catalog/                  # Course catalog
│   ├── login/                    # Login page
│   ├── admin/                    # Admin pages
│   ├── auth/                     # Auth callback
│   ├── layout.tsx                # Root layout
│   ├── page.tsx                  # Homepage
│   └── globals.css               # Global styles
├── components/                   # Reusable React components
│   ├── NavBar.tsx
│   ├── Footer.tsx
│   ├── CourseCard.tsx
│   └── Loading.tsx
├── lib/                          # Utility libraries
│   ├── supabase/                 # Supabase client configurations
│   └── utils.ts                  # Helper functions
├── types/                        # TypeScript type definitions
│   └── database.ts               # Database types
├── public/                       # Static assets
├── middleware.ts                 # Next.js middleware for auth
├── supabase-schema.sql           # Database schema
└── package.json                  # Dependencies

```

## 🔑 Key Features Implemented

### Authentication & Authorization
- ✅ Google OAuth sign-in with BITS email restriction
- ✅ Role-based access control (admin/student)
- ✅ Session management with Supabase Auth
- ✅ Middleware for route protection

### Student Features
- ✅ Browse course catalog
- ✅ Register for courses
- ✅ View enrolled courses
- ✅ Access course materials (Articles, Modules, Quizzes)
- ✅ Take quizzes and view results
- ✅ Track quiz attempts

### Admin Features
- ✅ Create and manage courses
- ✅ Add/edit course pages (Articles, Modules, Quizzes)
- ✅ Create and manage questions (MCQ, Numeric, Text)
- ✅ View registered students per course
- ✅ View all quiz attempts
- ✅ Manage question banks by groups
- ✅ Reorder course content

### Technical Features
- ✅ Server-side rendering with Next.js App Router
- ✅ TypeScript for type safety
- ✅ Tailwind CSS for styling (maintains original design)
- ✅ Row-level security (RLS) in Supabase
- ✅ Optimized for Vercel deployment
- ✅ No AWS dependencies

## 🚢 Deployment to Vercel

### 1. Push to GitHub

```bash
git init
git add .
git commit -m "Initial commit: Next.js refactored Noodle LMS"
git branch -M main
git remote add origin your-github-repo-url
git push -u origin main
```

### 2. Deploy to Vercel

1. Go to [vercel.com](https://vercel.com) and sign in
2. Click "New Project"
3. Import your GitHub repository
4. Configure:
   - Framework Preset: Next.js
   - Root Directory: `nextjs-app` (or leave as is if repo root)
   - Build Command: `npm run build`
   - Output Directory: (leave default)

5. Add Environment Variables:
   - Copy all variables from `.env.local`
   - Update `NEXT_PUBLIC_APP_URL` and `NEXTAUTH_URL` to your Vercel domain
   
6. Click "Deploy"

### 3. Post-Deployment

1. Update Google OAuth redirect URIs with your Vercel domain
2. Update Supabase Auth settings if needed
3. Test the deployed application

## 📝 Migration from Old Codebase

### What Changed

1. **Frontend**: Vue.js → React with Next.js
2. **Backend**: Express.js → Next.js API Routes
3. **Database**: MongoDB → PostgreSQL (Supabase)
4. **Auth**: Passport.js → Supabase Auth
5. **File Storage**: AWS S3 → Supabase Storage
6. **Hosting**: VM → Vercel (serverless)

### Data Migration

If you have existing data in MongoDB:

1. Export data from MongoDB:
   ```bash
   mongoexport --db noodle --collection users --out users.json
   mongoexport --db noodle --collection courses --out courses.json
   # ... export other collections
   ```

2. Transform and import to PostgreSQL:
   - Convert MongoDB ObjectIds to UUIDs
   - Adjust schema differences
   - Use Supabase API or direct SQL inserts

## 🔒 Security Features

- Row Level Security (RLS) policies on all tables
- Email domain restriction (@bits-pilani.ac.in)
- Server-side authentication checks
- API route protection with middleware
- Secure environment variable management

## 🎨 Design Preservation

The refactored version maintains the same UI/UX as the original:
- Same color scheme
- Same layout structure
- Same component hierarchy
- Only modernized with React components

## 📚 Additional Features to Implement

The following features from the original may need additional work:

1. **Rich Text Editor**: TipTap integration for article editing
2. **File Uploads**: Supabase Storage integration
3. **Quiz Timer**: Real-time quiz timing
4. **Notifications**: Toast notifications for user actions
5. **Advanced Question Types**: Full implementation of all question types

## 🐛 Troubleshooting

### Common Issues

1. **Authentication not working**:
   - Verify Google OAuth credentials
   - Check redirect URIs match exactly
   - Ensure Supabase Auth provider is enabled

2. **Database errors**:
   - Verify schema was created correctly
   - Check RLS policies are enabled
   - Ensure environment variables are set

3. **Build fails on Vercel**:
   - Check all environment variables are set
   - Verify no import errors
   - Check build logs for specific errors

## 📞 Support

For issues specific to this refactored version, check:
- Next.js documentation: [nextjs.org/docs](https://nextjs.org/docs)
- Supabase documentation: [supabase.com/docs](https://supabase.com/docs)
- Original repository: [github.com/samarsault/noodle](https://github.com/samarsault/noodle)

## 📄 License

Same as original Noodle project.

## 🙏 Credits

Original Noodle LMS by samarsault and contributors.
Refactored to Next.js + Supabase in 2026.
