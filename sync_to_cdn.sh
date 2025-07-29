#!/bin/bash

# Configuration
REPO_URL="git@github.com:CHAHBG/infoapp-assets.git"
ASSETS_DIR="assets/downloads"
CDN_DIR="$HOME/infoapp-assets" # Use $HOME for cross-platform compatibility
BRANCH="main"

# Ensure Git is installed
if ! command -v git &> /dev/null; then
    echo "Error: Git is not installed. Please install Git and try again."
    exit 1
fi

# Check if ASSETS_DIR exists
if [ ! -d "$ASSETS_DIR" ]; then
    echo "Error: Assets directory '$ASSETS_DIR' does not exist."
    exit 1
fi

# Create or navigate to CDN_DIR
mkdir -p "$CDN_DIR" || {
    echo "Error: Failed to create directory '$CDN_DIR'."
    exit 1
}

cd "$CDN_DIR" || {
    echo "Error: Failed to navigate to '$CDN_DIR'."
    exit 1
}

# Initialize or update the Git repository
if [ -d ".git" ]; then
    echo "Updating existing repository in $CDN_DIR..."
    git fetch origin
    git checkout "$BRANCH" || {
        echo "Error: Branch '$BRANCH' does not exist."
        exit 1
    }
    git pull origin "$BRANCH" || {
        echo "Error: Failed to pull from '$REPO_URL'."
        exit 1
    }
else
    echo "Cloning repository from $REPO_URL to $CDN_DIR..."
    git clone "$REPO_URL" . || {
        echo "Error: Failed to clone repository. Ensure SSH keys are configured."
        exit 1
    }
    git checkout "$BRANCH" || git checkout -b "$BRANCH"
fi

# Copy only valid assets (.mp4, .pdf)
find "../../$ASSETS_DIR" -type f \( -iname "*.mp4" -o -iname "*.pdf" \) -exec cp -v {} . \; || {
    echo "Error: Failed to copy assets from '$ASSETS_DIR'."
    exit 1
}

# Check for changes
if git status --porcelain | grep -q .; then
    echo "Changes detected. Committing and pushing to GitHub Pages..."
    git add .
    git commit -m "Update assets $(date '+%Y-%m-%d %H:%M:%S')" || {
        echo "Error: Failed to commit changes."
        exit 1
    }
    git push origin "$BRANCH" || {
        echo "Error: Failed to push to '$REPO_URL'. Check your SSH configuration."
        exit 1
    }
    echo "Assets successfully synced to GitHub Pages at https://CHAHBG.github.io/infoapp-assets/"
else
    echo "No changes detected in assets. Nothing to sync."
fi