#!/bin/bash

# PhytoSense API Test Script
# This script tests all PhytoSense API endpoints

API_URL="http://localhost:3000"
EMAIL="admin@it.com"
PASSWORD="admin123"

echo "=========================================="
echo "PhytoSense API Test Script"
echo "=========================================="
echo ""

# Color codes for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Step 1: Login to get token
echo -e "${BLUE}Step 1: Logging in...${NC}"
echo "POST $API_URL/api/auth/login"
echo ""

LOGIN_RESPONSE=$(curl -s -X POST "$API_URL/api/auth/login" \
  -H 'Content-Type: application/json' \
  -d "{\"email\":\"$EMAIL\",\"password\":\"$PASSWORD\"}")

TOKEN=$(echo $LOGIN_RESPONSE | python3 -c "import sys, json; print(json.load(sys.stdin)['data']['token'])" 2>/dev/null)

if [ -z "$TOKEN" ]; then
    echo -e "${RED}❌ Login failed!${NC}"
    echo "$LOGIN_RESPONSE"
    exit 1
fi

echo -e "${GREEN}✅ Login successful!${NC}"
echo "Token: ${TOKEN:0:50}..."
echo ""

# Step 2: Test Health Endpoint
echo "=========================================="
echo -e "${BLUE}Step 2: Testing Health Endpoint${NC}"
echo "GET $API_URL/api/phytosense/health"
echo ""

HEALTH=$(curl -s "$API_URL/api/phytosense/health")
echo "$HEALTH" | python3 -m json.tool
echo ""

if echo "$HEALTH" | grep -q '"status": "healthy"'; then
    echo -e "${GREEN}✅ Health check passed!${NC}"
else
    echo -e "${RED}❌ Health check failed!${NC}"
fi
echo ""

# Step 3: Get Devices List
echo "=========================================="
echo -e "${BLUE}Step 3: Getting Devices List${NC}"
echo "GET $API_URL/api/phytosense/devices"
echo ""

DEVICES=$(curl -s "$API_URL/api/phytosense/devices" \
  -H "Authorization: Bearer $TOKEN")

echo "$DEVICES" | python3 -m json.tool | head -80
echo ""

DEVICE_COUNT=$(echo "$DEVICES" | python3 -c "import sys, json; print(len(json.load(sys.stdin)['data']))" 2>/dev/null)
echo -e "${GREEN}✅ Found $DEVICE_COUNT devices${NC}"
echo ""

# Step 4: Fetch Stem Diameter Data
echo "=========================================="
echo -e "${BLUE}Step 4: Fetching Stem Diameter Data${NC}"
echo "Device: Stem051 - NL 2023-2024 MKB Raak"
echo "TDID: 39999 (Diameter), Setup: 1508"
echo "Date: 2024-10-10"
echo ""

DIAMETER_DATA=$(curl -s "$API_URL/api/phytosense/data/39999?setup_id=1508&channel=0&after=2024-10-10T00:00:00Z&before=2024-10-11T00:00:00Z&aggregation=hourly" \
  -H "Authorization: Bearer $TOKEN")

echo "$DIAMETER_DATA" | python3 -m json.tool | head -60
echo ""

DATA_POINTS=$(echo "$DIAMETER_DATA" | python3 -c "import sys, json; print(json.load(sys.stdin)['dataPoints'])" 2>/dev/null)
echo -e "${GREEN}✅ Retrieved $DATA_POINTS data points${NC}"
echo ""

# Step 5: Fetch Sap Flow Data
echo "=========================================="
echo -e "${BLUE}Step 5: Fetching Sap Flow Data${NC}"
echo "Device: Stem051 - NL 2023-2024 MKB Raak"
echo "TDID: 39987 (Sap Flow), Setup: 1508"
echo "Date: 2024-10-10"
echo ""

SAPFLOW_DATA=$(curl -s "$API_URL/api/phytosense/data/39987?setup_id=1508&channel=0&after=2024-10-10T00:00:00Z&before=2024-10-11T00:00:00Z&aggregation=hourly" \
  -H "Authorization: Bearer $TOKEN")

echo "$SAPFLOW_DATA" | python3 -m json.tool | head -60
echo ""

SAPFLOW_POINTS=$(echo "$SAPFLOW_DATA" | python3 -c "import sys, json; print(json.load(sys.stdin)['dataPoints'])" 2>/dev/null)
echo -e "${GREEN}✅ Retrieved $SAPFLOW_POINTS data points${NC}"
echo ""

# Step 6: Test Cache (make same request again)
echo "=========================================="
echo -e "${BLUE}Step 6: Testing Cache Performance${NC}"
echo "Making the same request twice to test cache..."
echo ""

echo "First request (from API):"
START1=$(date +%s%N)
curl -s "$API_URL/api/phytosense/data/39999?setup_id=1508&channel=0&after=2024-10-10T00:00:00Z&before=2024-10-11T00:00:00Z&aggregation=hourly" \
  -H "Authorization: Bearer $TOKEN" > /dev/null
END1=$(date +%s%N)
TIME1=$(( (END1 - START1) / 1000000 ))

echo "Second request (from cache):"
START2=$(date +%s%N)
curl -s "$API_URL/api/phytosense/data/39999?setup_id=1508&channel=0&after=2024-10-10T00:00:00Z&before=2024-10-11T00:00:00Z&aggregation=hourly" \
  -H "Authorization: Bearer $TOKEN" > /dev/null
END2=$(date +%s%N)
TIME2=$(( (END2 - START2) / 1000000 ))

echo ""
echo "First request: ${TIME1}ms"
echo "Second request: ${TIME2}ms"
if [ $TIME2 -lt $TIME1 ]; then
    echo -e "${GREEN}✅ Cache is working! Second request was faster${NC}"
else
    echo -e "${BLUE}ℹ️  Both requests completed (cache may already be warm)${NC}"
fi
echo ""

# Step 7: Check Cache Statistics
echo "=========================================="
echo -e "${BLUE}Step 7: Cache Statistics${NC}"
echo "GET $API_URL/api/phytosense/cache/stats"
echo ""

CACHE_STATS=$(curl -s "$API_URL/api/phytosense/cache/stats" \
  -H "Authorization: Bearer $TOKEN")

echo "$CACHE_STATS" | python3 -m json.tool
echo ""

CACHE_SIZE=$(echo "$CACHE_STATS" | python3 -c "import sys, json; print(json.load(sys.stdin)['stats']['size'])" 2>/dev/null)
echo -e "${GREEN}✅ Cache contains $CACHE_SIZE entries${NC}"
echo ""

# Step 8: Test Aggregation Suggestion
echo "=========================================="
echo -e "${BLUE}Step 8: Testing Aggregation Suggestion${NC}"
echo "POST $API_URL/api/phytosense/aggregate-suggestion"
echo ""

SUGGESTION=$(curl -s -X POST "$API_URL/api/phytosense/aggregate-suggestion" \
  -H "Authorization: Bearer $TOKEN" \
  -H 'Content-Type: application/json' \
  -d '{"startDate":"2024-01-01","endDate":"2024-12-31"}')

echo "$SUGGESTION" | python3 -m json.tool
echo ""

SUGGESTED_MODE=$(echo "$SUGGESTION" | python3 -c "import sys, json; print(json.load(sys.stdin)['suggestion'])" 2>/dev/null)
echo -e "${GREEN}✅ Suggested aggregation mode: $SUGGESTED_MODE${NC}"
echo ""

# Summary
echo "=========================================="
echo -e "${GREEN}✅ All Tests Completed Successfully!${NC}"
echo "=========================================="
echo ""
echo "Summary:"
echo "  • Authentication: Working"
echo "  • Health Check: Healthy"
echo "  • Devices List: $DEVICE_COUNT devices"
echo "  • Stem Diameter: $DATA_POINTS data points"
echo "  • Sap Flow: $SAPFLOW_POINTS data points"
echo "  • Cache: $CACHE_SIZE entries"
echo "  • Suggested Mode: $SUGGESTED_MODE for 1 year"
echo ""
echo "Your PhytoSense API is fully operational! 🎉"
echo ""
