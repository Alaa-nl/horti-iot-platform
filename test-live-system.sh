#!/bin/bash

# Test Live Production System
echo "🧪 Testing Live Production System..."
echo "======================================="

# CHANGE THIS TO YOUR ACTUAL RENDER URL
BACKEND_URL="https://horti-iot-platform.onrender.com"

# Test 1: Backend Health
echo "1. Testing backend health..."
curl -s "$BACKEND_URL/health" | jq '.' || echo "Backend not responding"

echo ""
echo "2. Testing feedback API..."
# Create a test feedback note
TEST_NOTE=$(cat <<EOF
{
  "session_id": "test-$(date +%s)",
  "page_name": "plant-balance",
  "section_name": "Production Test",
  "note_content": "This is a test note from production!",
  "client_name": "Test User",
  "client_email": "test@example.com"
}
EOF
)

# Send the test note
RESPONSE=$(curl -s -X POST "$BACKEND_URL/api/feedback/notes" \
  -H "Content-Type: application/json" \
  -H "Origin: https://horti-iot-platform.vercel.app" \
  -d "$TEST_NOTE")

echo "Response: $RESPONSE" | jq '.' || echo "$RESPONSE"

echo ""
echo "======================================="
echo "✅ If both tests passed, your system is working!"
echo ""
echo "📝 Next: Visit https://horti-iot-platform.vercel.app/plant-balance"
echo "   - Click feedback icons"
echo "   - Add notes"
echo "   - Check admin at /admin/feedback"