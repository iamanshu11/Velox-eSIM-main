#!/bin/bash
set -e

echo "=== eSIM Backend Build Script ==="
echo ""

# Ensure devDependencies are installed
echo "Step 1: Installing all dependencies (including devDependencies)..."
npm clean-install --verbose

# Verify critical type packages
echo ""
echo "Step 2: Verifying TypeScript type definitions..."
if [ ! -d "node_modules/@types/express" ]; then
  echo "ERROR: @types/express not found. Installing..."
  npm install --save-dev @types/express @types/node @types/jsonwebtoken @types/multer @types/bcryptjs @types/uuid
fi

# Generate Prisma client
echo ""
echo "Step 3: Generating Prisma Client..."
npx prisma generate

# Build TypeScript
echo ""
echo "Step 4: Building TypeScript..."
npm run build

# Prune production dependencies
echo ""
echo "Step 5: Pruning production dependencies..."
npm prune --production

echo ""
echo "=== Build Complete ==="
