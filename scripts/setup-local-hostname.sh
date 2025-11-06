#!/bin/bash

# Script to add getsltr.com to local hosts file
# This allows accessing the app via http://getsltr.com:3001 locally

HOSTS_FILE="/etc/hosts"
HOSTNAME="getsltr.com"
IP="127.0.0.1"

echo "🔧 Setting up local hostname mapping for getsltr.com..."
echo ""

# Check if entry already exists
if grep -q "$HOSTNAME" "$HOSTS_FILE"; then
    echo "✅ Entry for $HOSTNAME already exists in $HOSTS_FILE"
    echo ""
    echo "Current entry:"
    grep "$HOSTNAME" "$HOSTS_FILE"
    echo ""
    echo "If you want to update it, please edit /etc/hosts manually"
else
    echo "📝 Adding $IP $HOSTNAME to $HOSTS_FILE..."
    echo ""
    echo "This requires sudo privileges. You'll be prompted for your password."
    echo ""
    
    # Add the entry
    echo "$IP $HOSTNAME" | sudo tee -a "$HOSTS_FILE" > /dev/null
    
    if [ $? -eq 0 ]; then
        echo "✅ Successfully added $HOSTNAME to hosts file!"
        echo ""
        echo "You can now access the app at:"
        echo "  - http://getsltr.com:3001"
        echo "  - http://localhost:3001"
        echo ""
    else
        echo "❌ Failed to add entry. Please run manually:"
        echo "   sudo echo '$IP $HOSTNAME' >> $HOSTS_FILE"
        exit 1
    fi
fi

echo "🎉 Setup complete!"
echo ""
echo "To verify, run: cat $HOSTS_FILE | grep $HOSTNAME"

