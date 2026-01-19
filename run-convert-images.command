#!/bin/bash
cd "$(dirname "$0")"
echo "========================================"
echo "   Converting Images to WebP..."
echo "========================================"

# Check if node is installed
if ! command -v node &> /dev/null; then
    echo "Error: Node.js is not installed."
    exit 1
fi

# Install dependencies if needed (quietly)
echo "Checking dependencies..."
npm install --silent

# Run the script
echo "Running image converter..."
node scripts/convert_images.js

echo "========================================"
echo "   SUCCESS! Images converted."
echo "========================================"
echo "You can close this window."
read -n 1 -s -r -p "Press any key to exit..."
