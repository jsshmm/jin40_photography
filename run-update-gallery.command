#!/bin/bash
cd "$(dirname "$0")"
echo "========================================"
echo "   Updating Gallery Metadata..."
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
echo "Running metadata generator..."
node scripts/generate-metadata.js

echo "========================================"
echo "   SUCCESS! Gallery updated."
echo "========================================"
echo "You can close this window."
read -n 1 -s -r -p "Press any key to exit..."
