#!/bin/bash

# Quick deploy script for git add, commit, and push

if [ -z "$1" ]; then
    echo "Usage: ./deploy.sh \"commit message\""
    echo "Example: ./deploy.sh \"Add new blog post\""
    exit 1
fi

echo "========================================="
echo "  Quick Deploy Script"
echo "========================================="
echo ""

# Add all changes
echo "→ Adding all changes..."
git add .

# Commit with message
echo "→ Committing with message: $1"
git commit -m "$1

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"

# Push to remote
echo "→ Pushing to remote..."
git push

echo ""
echo "========================================="
echo "  ✓ Deploy complete!"
echo "========================================="
