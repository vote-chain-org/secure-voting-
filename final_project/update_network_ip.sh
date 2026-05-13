#!/bin/bash

# ==============================================================================
# Network IP Updater
# Automatically detects current LAN IP and updates all hardcoded React API URLs
# ==============================================================================

# Find current LAN IP (grabs the first IP returned by hostname -I)
NEW_IP=$(hostname -I | awk '{print $1}')

if [ -z "$NEW_IP" ]; then
    echo -e "\e[31mError: Could not determine local IP address.\e[0m"
    exit 1
fi

echo -e "\e[36mCurrent LAN IP detected as: \e[1m$NEW_IP\e[0m"
echo "Updating React frontend files..."

# Directory containing the files
PAGES_DIR="frontend/src/pages"

# Update port 8080 URLs (Backend API)
sed -i -E "s|http://[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}:8080|http://${NEW_IP}:8080|g" "$PAGES_DIR"/*.jsx

# Update port 5000 URLs (ML Service)
sed -i -E "s|http://[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}:5000|http://${NEW_IP}:5000|g" "$PAGES_DIR"/*.jsx

echo -e "\e[32mDone! Frontend files successfully updated to use \e[1m$NEW_IP\e[0m."
