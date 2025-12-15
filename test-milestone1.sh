#!/bin/bash

# Milestone 1 Test Helper Script
# This script helps verify the setup and provides quick test commands

echo "🧪 Milestone 1 Test Helper"
echo "=========================="
echo ""

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Check if server is running
echo "Checking if server is running..."
if lsof -Pi :3000 -sTCP:LISTEN -t >/dev/null ; then
    echo -e "${GREEN}✓ Server is running on port 3000${NC}"
else
    echo -e "${YELLOW}⚠ Server is not running${NC}"
    echo "Start the server with: npm run dev"
    echo ""
fi

# Check if .env.local exists
echo ""
echo "Checking environment setup..."
if [ -f ".env.local" ]; then
    echo -e "${GREEN}✓ .env.local file exists${NC}"
    
    # Check for required variables
    if grep -q "MONGODB_URI" .env.local; then
        echo -e "${GREEN}✓ MONGODB_URI found${NC}"
    else
        echo -e "${RED}✗ MONGODB_URI not found in .env.local${NC}"
    fi
    
    if grep -q "NEXTAUTH_SECRET" .env.local; then
        echo -e "${GREEN}✓ NEXTAUTH_SECRET found${NC}"
    else
        echo -e "${RED}✗ NEXTAUTH_SECRET not found in .env.local${NC}"
    fi
else
    echo -e "${YELLOW}⚠ .env.local file not found${NC}"
    echo "Run: bash setup-env.sh (if available)"
    echo "Or create .env.local manually"
fi

echo ""
echo "=========================="
echo ""
echo "Quick Test Commands:"
echo ""
echo "1. Initialize HR Admin:"
echo "   curl -X POST http://localhost:3000/api/v1/init"
echo "   Or visit: http://localhost:3000/api/v1/init"
echo ""
echo "2. Check if HR admin exists:"
echo "   curl http://localhost:3000/api/v1/init"
echo ""
echo "3. List employees (requires auth):"
echo "   curl http://localhost:3000/api/v1/employees"
echo ""
echo "4. Check attendance (requires auth):"
echo "   curl http://localhost:3000/api/v1/attendance?employeeId=<id>"
echo ""
echo "=========================="
echo ""
echo "📚 Full test guide: MILESTONE1_TEST_GUIDE.md"
echo ""
echo "To start testing:"
echo "1. Start server: npm run dev"
echo "2. Initialize: Visit http://localhost:3000/api/v1/init"
echo "3. Follow: MILESTONE1_TEST_GUIDE.md"
echo ""

