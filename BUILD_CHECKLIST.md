# Production Build Checklist

## ✅ Build Status
- **Build Command**: `npm run build`
- **Status**: ✅ **BUILD READY**
- **Last Verified**: $(date)

## Pre-Deployment Checklist

### 1. Environment Variables
Ensure all required environment variables are set in your production environment:

```bash
# Database
MONGODB_URI=your_mongodb_connection_string

# NextAuth
NEXTAUTH_URL=your_production_url
NEXTAUTH_SECRET=your_secret_key

# Stream Chat (if using)
NEXT_PUBLIC_STREAM_API_KEY=your_stream_api_key
STREAM_API_SECRET=your_stream_api_secret

# Other services (if applicable)
GOOGLE_MAPS_API_KEY=your_google_maps_key
```

### 2. Database Setup
- [ ] Run module initialization: `node scripts/init-modules.js`
- [ ] Verify modules exist: `node scripts/check-modules.js`
- [ ] Assign modules to existing users (if needed): `node scripts/give-random-modules.js`
- [ ] Ensure all required collections exist and are indexed

### 3. Dependencies
- [ ] Run `npm install --production` (or `npm ci` for exact versions)
- [ ] Verify all peer dependencies are installed
- [ ] Check for security vulnerabilities: `npm audit`

### 4. Build Verification
- [ ] Run `npm run build` successfully
- [ ] No TypeScript errors
- [ ] No ESLint errors
- [ ] All pages compile correctly
- [ ] API routes are properly configured

### 5. Code Quality
- [ ] Removed debug `console.log` statements (production code)
- [ ] Error handling in place for all API routes
- [ ] Authentication checks on protected routes
- [ ] Module access checks implemented

### 6. Performance Optimizations
- [ ] Dynamic routes marked with `export const dynamic = 'force-dynamic'`
- [ ] Static assets optimized
- [ ] Images optimized (if applicable)
- [ ] Bundle size acceptable

### 7. Security
- [ ] Environment variables not exposed in client-side code
- [ ] API routes properly authenticated
- [ ] CORS configured correctly
- [ ] Rate limiting implemented (if applicable)
- [ ] Input validation on all API endpoints

### 8. Testing
- [ ] Test authentication flow
- [ ] Test module purchase flow
- [ ] Test module access control
- [ ] Test API endpoints
- [ ] Test error handling

## Deployment Steps

### For Vercel:
1. Connect your repository to Vercel
2. Set environment variables in Vercel dashboard
3. Deploy (automatic on push to main branch)

### For Other Platforms:
1. Build: `npm run build`
2. Start: `npm start` (runs on port 3000 by default)
3. Or use PM2: `pm2 start npm --name "workforce" -- start`

## Post-Deployment Verification

- [ ] Landing page loads correctly
- [ ] Login functionality works
- [ ] Module marketplace displays correctly
- [ ] Module purchase flow works
- [ ] User dashboard accessible
- [ ] All module dashboards accessible (for users with access)
- [ ] API endpoints respond correctly
- [ ] Database connections stable
- [ ] No console errors in browser
- [ ] Mobile responsiveness verified

## Known Warnings (Non-Critical)

1. **Mongoose Index Warning**: Duplicate index on `serialNumber` in Tool model - Fixed
2. **Webpack Deprecation**: Module.updateHash deprecation - Non-critical, Next.js will handle in future updates
3. **Dynamic Server Usage**: Expected for authenticated routes - All marked with `force-dynamic`

## Troubleshooting

### Build Fails:
- Check Node.js version (requires 18+)
- Clear `.next` folder: `rm -rf .next`
- Clear node_modules: `rm -rf node_modules && npm install`
- Check for TypeScript errors: `npx tsc --noEmit`

### Modules Not Showing:
- Run `node scripts/init-modules.js`
- Verify database connection
- Check `MONGODB_URI` environment variable

### Authentication Issues:
- Verify `NEXTAUTH_URL` matches production URL
- Check `NEXTAUTH_SECRET` is set
- Verify session configuration in `lib/auth/config.js`

## Maintenance

### Regular Tasks:
- Monitor error logs
- Update dependencies regularly
- Backup database regularly
- Review and update module configurations as needed

## Support

For issues or questions, check:
- Application logs
- Database connection status
- Environment variable configuration
- Next.js documentation: https://nextjs.org/docs

