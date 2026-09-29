#!/bin/bash
set -e

SERVER="root@88.222.242.85"
DEST="/var/www/quickartphotography"

echo "🚀 Syncing website files to live server..."

rsync -avz -e ssh \
  --exclude='.git' \
  --exclude='node_modules' \
  --exclude='.DS_Store' \
  --exclude='data/' \
  --exclude='uploads/' \
  --exclude='scratch/' \
  ./ "$SERVER:$DEST/"

echo "🔒 Setting server file permissions..."
ssh "$SERVER" "chown -R www-data:www-data $DEST && chmod -R 775 $DEST/data $DEST/uploads && systemctl reload nginx && systemctl reload php8.3-fpm"

echo "✅ Deployment completed successfully!"
