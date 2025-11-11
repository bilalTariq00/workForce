#!/bin/bash

# Create .env.local file with MongoDB Atlas connection
cat > .env.local << EOF
# MongoDB Connection (MongoDB Atlas)
MONGODB_URI=mongodb+srv://bilal002ta_db_user:1n9GS5zvaDWAgKBy@cluster0.eaatg0a.mongodb.net/workforce?retryWrites=true&w=majority

# NextAuth Configuration
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=3NRkg2RkIrgTjQ9SuIUP6j0cI2LkCckjAg/HQx/xbrQ=

# Default HR Admin Credentials (change after first login)
DEFAULT_HR_EMAIL=hr@workforce.com
DEFAULT_HR_PASSWORD=Admin@123
EOF

echo "✅ .env.local file created successfully!"
echo ""
echo "Your MongoDB Atlas connection is configured."
echo "Next steps:"
echo "1. Run: npm install"
echo "2. Run: npm run dev"
echo "3. Initialize HR admin: curl -X POST http://localhost:3000/api/v1/init"
echo "4. Login at http://localhost:3000/login"

