# Build Instructions

## Development Build

```bash
npm install
npm run dev
```

## Production Build

```bash
# Install dependencies
npm install

# Build the application
npm run build

# Start production server
npm start
```

## Build Output

The build process will:
- Compile Next.js application
- Optimize assets
- Generate static pages where possible
- Create production-ready bundle

## Build Warnings

The following warnings are expected and can be ignored:
- MongoDB connection errors during build (normal - DB not needed for build)
- Mongoose index warnings (handled in code)

## Pre-Build Checklist

- [ ] All environment variables set
- [ ] Dependencies installed (`npm install`)
- [ ] No TypeScript/ESLint errors
- [ ] `.env.local` file exists (not committed to git)

## Post-Build

After successful build:
- `.next/` folder contains optimized production build
- Run `npm start` to serve production build
- Or deploy to platform (Vercel, Railway, etc.)

## Troubleshooting Build Issues

### "Module not found"
- Run `npm install` to install dependencies

### "Invalid next.config.js"
- Check `next.config.js` for deprecated options
- Remove `experimental.serverActions` (enabled by default)

### Build fails with MongoDB errors
- This is normal during build - MongoDB not required for build
- Errors only occur if API routes are called during static generation

### TypeScript errors
- Check `tsconfig.json` configuration
- Ensure all types are properly defined

