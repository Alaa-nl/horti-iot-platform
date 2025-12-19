# 🚀 Deployment Guide for Feedback System

## Quick Setup with Railway (Recommended - 10 minutes)

### Step 1: Database Setup (Supabase - Free)
1. Go to https://supabase.com and create a free account
2. Create a new project
3. Go to Settings → Database
4. Copy your connection string (it looks like: `postgresql://postgres:[YOUR-PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres`)
5. Run the migration to create feedback_notes table:
   - Go to SQL Editor in Supabase
   - Paste the content from `database/migrations/009_create_feedback_notes.sql`
   - Click Run

### Step 2: Backend Deployment (Railway)
1. Go to https://railway.app and sign up (free)
2. Create a new project
3. Choose "Deploy from GitHub repo"
4. Select your `horti-iot-platform` repository
5. Railway will detect it's a Node.js app
6. Add these environment variables in Railway dashboard:
   ```
   NODE_ENV=production
   PORT=3001

   # Use your Supabase connection details
   DB_HOST=db.[PROJECT-REF].supabase.co
   DB_PORT=5432
   DB_NAME=postgres
   DB_USER=postgres
   DB_PASSWORD=[YOUR-SUPABASE-PASSWORD]

   # Security
   JWT_SECRET=generate-a-random-string-here
   JWT_REFRESH_SECRET=generate-another-random-string-here

   # Allow your Vercel frontend
   CORS_ORIGIN=https://horti-iot-platform.vercel.app

   # PhytoSense (your existing credentials)
   PHYTOSENSE_USERNAME=aaldrobe
   PHYTOSENSE_PASSWORD=your-password
   ```
7. Set the start command to: `cd backend && npm install && npm run build && npm start`
8. Deploy! Railway will give you a URL like: `https://your-app.up.railway.app`

### Step 3: Update Frontend (Vercel)
1. Go to your Vercel dashboard: https://vercel.com/dashboard
2. Select your `horti-iot-platform` project
3. Go to Settings → Environment Variables
4. Add/Update:
   ```
   REACT_APP_API_URL=https://your-app.up.railway.app/api
   ```
   (Use your actual Railway URL from Step 2)
5. Redeploy your frontend (Vercel will do this automatically when you push)

### Step 4: Test It!
1. Visit https://horti-iot-platform.vercel.app/plant-balance
2. Click a feedback icon
3. Add a note
4. Check it saved: Visit https://horti-iot-platform.vercel.app/admin/feedback

---

## Alternative: Quick Setup with Render (Also Free)

### Backend on Render:
1. Go to https://render.com
2. Create a Web Service
3. Connect your GitHub repo
4. Settings:
   - Build Command: `cd backend && npm install && npm run build`
   - Start Command: `cd backend && npm start`
   - Add environment variables (same as Railway above)

### Database on Render:
- Render offers free PostgreSQL
- Or use Supabase/Neon as described above

---

## 🔍 Verification Checklist

After deployment, verify:
- [ ] Backend API is accessible: `https://your-backend-url/health`
- [ ] CORS allows your frontend: No console errors about CORS
- [ ] Database connected: Check backend logs
- [ ] Feedback saves: Test adding a note
- [ ] Admin can view: Check /admin/feedback page

## 🚨 Common Issues

**"Failed to save feedback note"**
- Check browser console for CORS errors
- Verify REACT_APP_API_URL in Vercel

**"Cannot connect to database"**
- Check database credentials in backend environment
- Ensure database allows external connections

**"API endpoint not found"**
- Make sure backend is deployed and running
- Check the API URL doesn't have double `/api/api`

## 📝 Summary

Once deployed:
1. ✅ Your client can visit https://horti-iot-platform.vercel.app/plant-balance
2. ✅ They can add feedback notes
3. ✅ Notes are saved to cloud database
4. ✅ You can view them at /admin/feedback
5. ✅ Everything works from anywhere, not just localhost!