# GigConnect Dashboard - Deployment Guide

## Prerequisites

- Node.js 20+ installed
- PostgreSQL database (Neon, RDS, or self-hosted)
- Google Maps API Key
- Gmail API credentials (optional, for email import)

## Environment Variables

Create a `.env` file with the following variables:

```bash
# Database
DATABASE_URL=postgresql://user:password@host:port/database

# Google Services
GOOGLE_MAPS_API_KEY=your_google_maps_api_key

# Gmail API (optional)
GMAIL_CLIENT_ID=your_gmail_client_id
GMAIL_CLIENT_SECRET=your_gmail_client_secret

# Application
NODE_ENV=production
PORT=5000
SESSION_SECRET=your_random_session_secret
```

## Deployment Options

### Option 1: Replit Deploy (Recommended)

1. Click the "Publish" button in Replit
2. Add environment secrets in Replit's Secrets tab
3. Your app will be automatically deployed at `*.replit.app`

### Option 2: Docker Deployment

```bash
# Build the Docker image
docker build -t gigconnect .

# Run the container
docker run -p 5000:5000 \
  -e DATABASE_URL=your_database_url \
  -e GOOGLE_MAPS_API_KEY=your_api_key \
  --name gigconnect \
  gigconnect
```

### Option 3: Node.js Manual Deployment

```bash
# Install dependencies
npm install

# Build the application
npm run build

# Push database schema
npm run db:push

# Start production server
NODE_ENV=production node dist/server/index.js
```

## Database Setup

1. Create a PostgreSQL database
2. Set DATABASE_URL environment variable
3. Run migrations:
   ```bash
   npm run db:push
   ```

## Mobile App Deployment

### iOS

1. Set up Apple Developer account
2. Configure app signing
3. Build for iOS:
   ```bash
   # Using Expo (if configured)
   npx expo build:ios
   ```

### Android

1. Generate signing key
2. Configure gradle
3. Build APK/AAB:
   ```bash
   # Using Expo (if configured)
   npx expo build:android
   ```

### Progressive Web App (PWA)

The app is already configured as a PWA:
- `manifest.json` for install prompts
- Service Worker for offline support
- Users can "Add to Home Screen" on mobile

## Post-Deployment Checklist

- [ ] Database migrations completed
- [ ] Environment variables configured
- [ ] Google Maps API key added
- [ ] Test email import (if using)
- [ ] Verify routing works with GPS
- [ ] Test offline mode
- [ ] Configure domain (optional)
- [ ] Set up SSL/TLS certificate
- [ ] Configure CDN for static assets (optional)
- [ ] Set up monitoring and logging
- [ ] Configure backup strategy

## Performance Optimization

1. **Enable Caching**: Configure Redis for session storage
2. **CDN**: Use Cloudflare or similar for static assets
3. **Database Indexing**: Ensure proper indexes on frequently queried columns
4. **Compression**: Enable gzip compression in production

## Monitoring

Recommended monitoring tools:
- Application: Sentry, LogRocket
- Infrastructure: DataDog, New Relic
- Uptime: UptimeRobot, Pingdom

## Support

For issues or questions:
1. Check the documentation in `replit.md`
2. Review error logs
3. Contact support

## Security Notes

- Never commit `.env` files
- Rotate API keys regularly
- Use HTTPS in production
- Implement rate limiting
- Enable CORS properly
- Validate all user inputs
- Use prepared statements for SQL queries
