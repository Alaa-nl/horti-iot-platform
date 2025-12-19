#!/bin/bash

# Test Production Feedback System
echo "🧪 Testing Production Feedback System..."
echo "======================================="

# Replace with your actual Railway URL
RAILWAY_URL="https://your-app-name.up.railway.app"

# Test health check
echo "1. Testing backend health..."
curl -s "$RAILWAY_URL/health" | jq '.' || echo "Backend not responding"

echo ""
echo "2. Testing feedback endpoint..."
TEST_NOTE=$(cat <<EOF
{
  "session_id": "test-$(date +%s)",
  "page_name": "plant-balance",
  "section_name": "Test Section",
  "note_content": "Test note from production test",
  "client_name": "Test User",
  "client_email": "test@example.com"
}
EOF
)

RESPONSE=$(curl -s -X POST "$RAILWAY_URL/api/feedback/notes" \
  -H "Content-Type: application/json" \
  -d "$TEST_NOTE")

echo "Response: $RESPONSE" | jq '.' || echo "$RESPONSE"

echo ""
echo "======================================="
echo "✅ If you see success responses above, your production is working!"
echo "📝 Now visit: https://horti-iot-platform.vercel.app/plant-balance"
echo "👤 And check admin: https://horti-iot-platform.vercel.app/admin/feedback"