# 🚀 Stock Tracker Pro - Setup Guide

## Prerequisites

### 1. Install Node.js (Required)

If you haven't installed Node.js yet:

1. **Download**: Visit [https://nodejs.org/](https://nodejs.org/)
2. **Choose**: Download the **LTS version** (Long Term Support)
3. **Install**: Run the installer and follow the wizard
   - ✅ Ensure "Add to PATH" is checked
   - Accept all default settings
4. **Verify**: Open a **NEW** PowerShell window and run:
   ```powershell
   node --version
   npm --version
   ```
   Both should display version numbers (e.g., `v20.x.x` and `10.x.x`)

---

## 🛠️ Installation Steps

### 1. Navigate to Project Directory

```powershell
cd "d:\Fund Issuer\anti-proj"
```

### 2. Install Dependencies

```powershell
npm install
```

This will install all required packages (React, TypeScript, Vite, etc.)

**Expected**: You'll see a progress bar and "added XXX packages" when complete.

### 3. Configure Environment Variables

Copy the example environment file and fill in your Supabase credentials:

```powershell
cp .env.example .env
```

Then edit `.env` and add your Supabase configuration:

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your_anon_key_here
```

> **Note**: Stock market data uses **free Yahoo Finance API** - no API keys needed! 🎉

---

## ▶️ Running the App

### Development Mode (Recommended)

```powershell
npm run dev
```

- The app will start at `http://localhost:5173` (or similar)
- Browser will auto-open
- Hot reload enabled (changes appear instantly)
- Console logs show data fetching activity

### Build for Production

```powershell
npm run build
```

- Creates optimized production build in `dist/` folder
- Use this before deploying

### Preview Production Build

```powershell
npm run preview
```

- Test the production build locally before deployment

---

## 🧪 Testing the Free Data Features

Once the app is running, test these features:

### ✅ Stock Search
1. Search for "AAPL" or "MSFT"
2. Check browser console for:
   ```
   📊 Fetching live data for AAPL from Yahoo Finance...
   ✅ Live data retrieved for AAPL
   ```

### ✅ Market Heatmap
1. Navigate to Market Overview
2. S&P 500 heatmap should load via TradingView widget
3. Interactive zoom and tooltips should work

### ✅ News Feed
1. View any stock details
2. Console should show:
   ```
   📰 Generating news for AAPL...
   ```

### ✅ Fallback Behavior
1. If Yahoo Finance fails, app uses enhanced mock data
2. Console shows: `📝 Using mock data for AAPL`

---

## 🐛 Troubleshooting

### "node is not recognized"
- **Solution**: Restart PowerShell after installing Node.js
- **Or**: Close and reopen your terminal/editor completely

### Port Already in Use
```
Port 5173 is already in use
```
- **Solution**: Kill the process or use different port:
  ```powershell
  npm run dev -- --port 3000
  ```

### Build Errors
- **Solution**: Clear cache and reinstall:
  ```powershell
  Remove-Item -Recurse -Force node_modules
  Remove-Item package-lock.json
  npm install
  ```

### Supabase Connection Issues
- Verify `.env` file exists and has correct credentials
- Check Supabase project is active at [https://supabase.com/dashboard](https://supabase.com/dashboard)

---

## 📦 Deployment

### Deploy to Vercel (Recommended)

The project includes `deploy.bat` for easy deployment:

```powershell
.\deploy.bat
```

Or manually:

```powershell
git add .
git commit -m "Update: Free data sources implemented"
git push origin main
```

Vercel will auto-deploy on push if connected.

---

## 🎯 Key Features (No API Keys!)

- ✅ **Real-time Stock Quotes** - Yahoo Finance API (free)
- ✅ **Market Heatmap** - TradingView widget (free)
- ✅ **Enhanced Mock Data** - Realistic fallback data
- ✅ **Smart Caching** - 30-second cache reduces API calls
- ✅ **News Feed** - Realistic mock news with variety

---

## 💡 Tips

1. **Console Logs**: Keep DevTools console open to see data fetching activity
2. **Caching**: Same stock fetched within 30 seconds uses cache (faster!)
3. **Mock Data**: Deterministic - same symbol = same mock data every time
4. **Development**: Use bypass email `bitdegenbiz@gmail.com` for quick login testing

---

## 📚 Quick Command Reference

```powershell
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Run linter
npm run lint

# Deploy to Vercel
.\deploy.bat
```

---

## ✨ What's New

### Free Data Sources Implementation

- Removed all API key requirements
- Yahoo Finance provides real market data
- Enhanced mock data as reliable fallback
- Improved caching strategy
- Better error handling and logging

See [walkthrough.md](C:\Users\Mourad.Zaher\.gemini\antigravity\brain\b68ae9df-c46a-4c41-ab96-abeba9ccad75\walkthrough.md) for detailed changes.

---

## 🆘 Need Help?

- Check the console for detailed error messages
- Review `.env` configuration
- Verify Node.js version is 18+ (LTS recommended)
- Ensure all dependencies installed successfully

---

**Ready to go! Once Node.js is installed, run `npm install` then `npm run dev` to start! 🚀**
