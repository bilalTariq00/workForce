# Deployment Guide

This guide will help you deploy the Workforce Management System to production.

## Prerequisites

- Node.js 18+ installed
- MongoDB Atlas account (or MongoDB instance)
- Deployment platform account (Vercel, Railway, etc.)

## Environment Variables

Create a `.env.local` file (or set environment variables in your deployment platform) with:

```env
# MongoDB Connection
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/workforce?retryWrites=true&w=majority

# NextAuth Configuration
NEXTAUTH_URL=https://your-domain.com
NEXTAUTH_SECRET=your-secret-key-here-generate-with-openssl-rand-base64-32

# Default HR Admin Credentials (change after first login)
DEFAULT_HR_EMAIL=hr@workforce.com
DEFAULT_HR_PASSWORD=Admin@123
```

**Important:** 
- Generate `NEXTAUTH_SECRET` using: `openssl rand -base64 32`
- Update `NEXTAUTH_URL` to your production domain
- Change default HR credentials after first login

## Build Commands

```bash
# Install dependencies
npm install

# Build for production
npm run build

# Start production server
npm start
```

## Deployment Platforms

### Vercel (Recommended)

1. Push your code to GitHub
2. Import project in Vercel
3. Add environment variables in Vercel dashboard
4. Deploy

Vercel will automatically:
- Detect Next.js
- Run `npm run build`
- Deploy your app

### Railway

1. Connect your GitHub repository
2. Add environment variables
3. Railway will auto-deploy on push

### Docker

Create a `Dockerfile`:

```dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY . .
RUN npm run build

EXPOSE 3000

CMD ["npm", "start"]
```

## Post-Deployment Steps

1. **Initialize HR Admin:**
   ```bash
   curl -X POST https://your-domain.com/api/v1/init
   ```

2. **Test Connection:**
   ```bash
   curl https://your-domain.com/api/test-connection
   ```

3. **Login and Change Default Credentials:**
   - Go to `/login`
   - Use default HR credentials
   - Change password immediately

## MongoDB Atlas Setup

1. Create a MongoDB Atlas cluster
2. Add your deployment platform's IP addresses to Network Access
3. Create a database user
4. Get connection string
5. Add to environment variables

## Security Checklist

- [ ] Changed default HR password
- [ ] Strong NEXTAUTH_SECRET generated
- [ ] MongoDB connection string secured
- [ ] Environment variables not committed to git
- [ ] HTTPS enabled (automatic on Vercel/Railway)
- [ ] MongoDB IP whitelist configured

## Troubleshooting

### Build Errors

- Check Node.js version (18+)
- Ensure all dependencies are installed
- Check for TypeScript/ESLint errors

### Database Connection Issues

- Verify MongoDB URI is correct
- Check IP whitelist in MongoDB Atlas
- Ensure database user has proper permissions

### Authentication Issues

- Verify NEXTAUTH_SECRET is set
- Check NEXTAUTH_URL matches your domain
- Clear browser cookies if needed

## Performance Optimization

- Enable Next.js Image Optimization
- Use CDN for static assets
- Enable MongoDB connection pooling
- Monitor API response times

## Monitoring

Consider setting up:
- Error tracking (Sentry)
- Analytics (Vercel Analytics)
- Uptime monitoring
- Database monitoring

