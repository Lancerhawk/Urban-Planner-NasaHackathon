# 🚀 Deployment Guide for NASA Hackathon Webapp

## 🐳 Railway Deployment (Recommended)

### Prerequisites
- GitHub repository with your code
- Railway account (free tier available)

### Steps

1. **Push your code to GitHub**:
   ```bash
   git add .
   git commit -m "Add Dockerfile and deployment config"
   git push origin main
   ```

2. **Deploy to Railway**:
   - Go to [Railway.app](https://railway.app)
   - Click "New Project" → "Deploy from GitHub repo"
   - Select your repository
   - Railway will automatically detect the Dockerfile and deploy

3. **Environment Variables** (if needed):
   - In Railway dashboard, go to your project
   - Add any environment variables in the "Variables" tab

### What the Dockerfile does:
- Uses Node.js 18 Alpine (lightweight Linux)
- Installs GDAL and dependencies
- Installs all npm dependencies (including dev dependencies for build)
- Builds the Next.js application
- Removes dev dependencies to reduce final image size
- Sets up proper environment variables
- Runs your Next.js app

## 🔧 Alternative: Manual Docker Build

If you want to test locally first:

```bash
# Build the Docker image
docker build -t nasa-hackathon-webapp .

# Run the container
docker run -p 3000:3000 nasa-hackathon-webapp
```

## 🐛 Troubleshooting

### GDAL Not Found Error
If you see "GDAL is not available" errors:
1. Check Railway logs for GDAL installation
2. Ensure the Dockerfile is properly configured
3. Verify the GDAL paths in `lib/gdal-reader.js`

### Data Files Not Found
If NASA data files are missing:
1. Ensure all files in `public/data/` are committed to Git
2. Check file sizes (Git has a 100MB limit per file)
3. Use Git LFS for large files if needed

### Build Failures
1. Check Railway build logs
2. Ensure all dependencies are in `package.json`
3. Verify Dockerfile syntax

## 📊 Monitoring

- Check Railway dashboard for deployment status
- Monitor logs for any errors
- Test the NASA data API endpoints after deployment

## 🔄 Updates

To update your deployment:
1. Push changes to GitHub
2. Railway will automatically redeploy
3. Check logs for any issues

## 💡 Tips

- Railway free tier has resource limits
- Consider upgrading for production use
- Monitor memory usage with GDAL processing
- Use Railway's built-in monitoring tools
