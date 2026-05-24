#!/bin/bash
IP=$(ipconfig getifaddr en0)
if [ -z "$IP" ]; then
  echo "تعذّر الحصول على الـ IP"
  exit 1
fi
sed -i '' "s|http://[0-9.]*:8000|http://$IP:8000|g" src/services/api.ts
echo "تم تحديث الـ IP إلى: $IP"
