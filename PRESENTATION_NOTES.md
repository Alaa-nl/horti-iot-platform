# HORTI-IOT Platform - 30-Minute Presentation

## Slide 1: Project Overview (2 minutes)

### What is HORTI-IOT?
A smart greenhouse management platform that helps researchers and growers make better decisions using real-time data and AI predictions.

**Key Purpose:**
- Monitor plant health in real-time
- Track environmental conditions (temperature, humidity, CO2)
- Predict crop performance using machine learning
- Help researchers study plant growth patterns

---

## Slide 2: Technology Stack (3 minutes)

### Frontend 
- **React 19** with **TypeScript** - Modern, type-safe web interface
- **Tailwind CSS** - Beautiful, responsive design
- **Framer Motion** - Smooth animations and transitions
- **Recharts** - Interactive charts for data visualization

### Backend 
- **Node.js** with **Express** - Fast, reliable server
- **PostgreSQL** with **TimescaleDB** - Time-series database optimized for sensor data
- **JWT Authentication** - Secure login system

### Why These Technologies?
- **React + TypeScript**: Catches errors before they happen, makes code reliable
- **PostgreSQL + TimescaleDB**: Perfect for storing millions of sensor readings efficiently
- **Tailwind CSS**: Builds professional-looking interfaces quickly
- **JWT**: Industry-standard secure authentication

---

## Slide 3: How Login Works (3 minutes)

### Simple 3-Step Process:

**Step 1: User enters credentials**
- Email: 
- Password: 

**Step 2: Backend validates**
```
Frontend sends → Backend checks database → Creates JWT token
```

**Step 3: Token stored and user logged in**
- Token saved in browser's localStorage
- All future requests include this token
- Token expires after 24 hours (balances security with UX)

### User Roles
The system supports 3 types of users:
1. **Admin** - Manages users and system settings
2. **Researcher** - Accesses research dashboard with detailed plant data
3. **Grower** - Views financial and production data


**Why JWT?**
- Secure and industry-standard
- Stateless (server doesn't need to remember sessions)
- Easy to implement across different devices

---

## Slide 4: Database Architecture (2 minutes)

### Key Tables:
1. **users** - Login credentials and user info
2. **greenhouses** - Greenhouse details (location, size, crop type)
3. **climate_measurements** - Temperature, humidity, CO2 (every 5 minutes)
4. **sap_flow_measurements** - Plant water usage data from PhytoSense sensors
5. **camera_images** - RGBD images for ML analysis
6. **ml_predictions** - AI-generated forecasts

### Why TimescaleDB?
- Handles millions of sensor readings efficiently
- Automatic data compression
- Fast queries for time-series data (e.g., "show me last 24 hours")

---

## Slide 5: Researcher Dashboard - MAIN FOCUS (15 minutes)



### Feature 1: Greenhouse Selector (Line 541-547)

**What it does:**
Allows researchers to switch between different greenhouses to view their data.

**How it works:**
- Dropdown menu shows all available greenhouses
- When you select one, it loads that greenhouse's data
- Selection is saved in browser (so it remembers your choice)

**Why this design?**
- Researchers often monitor multiple greenhouses
- Quick switching without navigating to different pages
- Persistent selection reduces clicks

---

### Feature 2: Farm Details Display (Line 551-594)

**What it shows:**
- Farm ID
- Location (city, region)
- Land area (in m²)
- Crop type (e.g., tomato)
- Variety (e.g., "Xandor XR")
- Supplier
- Climate system
- Lighting system
- CO2 target
- Temperature range

**Why so detailed?**
- Researchers need context for their measurements
- Different varieties behave differently
- Climate settings affect growth patterns
- All this context helps interpret sensor data correctly

**Visual Design:**
- Used gradient cards with different colors
- Each metric has an emoji for quick recognition
- Hover effects make it interactive
- Grid layout adapts to screen size (responsive)

---

### Feature 3: Weather Information 

**What it displays:**
- Current temperature 
- Weather condition 
- Humidity percentage
- Wind speed
- Air pressure
- 4-day forecast
- Sunrise and sunset times

**Data Source:**
Uses **Open-Meteo API** with ECMWF (European Centre for Medium-Range Weather Forecasts) models
- Free, no API key required
- Uses KNMI station coordinates for accurate Netherlands locations
- High-quality European weather data

**Why weather data?**
- Outdoor weather affects greenhouse climate
- Helps predict heating/cooling needs
- Growers adjust irrigation based on weather
- Planning harvest around weather conditions

**Design Choice:**
- Blue gradient background (represents sky/weather)
- Large, easy-to-read temperature
- Emoji icons make conditions immediately clear
- Updates every 10 minutes automatically

---

### Feature 4: Head Thickness Prediction (Line 689-768)

**What it is:**
AI predicts how thick the lettuce/cabbage heads will grow in the next 3 days.

**How it works:**
- Shows current thickness (e.g., 12.5 cm)
- 3-day forecast with predictions
- Confidence score for each prediction (e.g., 92%)
- Trend indicator (up ⬆, down ⬇, stable ➡)
- Interactive chart showing growth curve

**Why this matters:**
- Head thickness determines harvest timing
- Too thin = not ready, too thick = overripe
- AI helps optimize harvest for best quality
- Predictions help plan labor and logistics

**Technical Details:**
- Updates every 30 seconds (for demo purposes)
- Real system would use machine learning model
- Based on historical data patterns
- 89% accuracy claimed

**Visual Elements:**
- Green color scheme (represents growth/health)
- Large numbers for current value
- Chart shows trend over time
- Color-coded bars (green=growing, yellow=stable, red=declining)

---

### Feature 5: Plant Monitoring - Sap Flow 

**What it measures:**
Water flow through plant stems - tells you how much water the plant is drinking.

**Data Sources:**
- 8 different sensors from 2022-2024
- Two plant stems: Stem051 and Stem136
- Measurements every hour

**How it works:**
```
1. Fetches data from PhytoSense API
2. Tries multiple sensors if first one fails
3. Shows either:
   - Sap flow (g/h) - how fast water moves
   - Stem diameter (μm) - thickness of stem
4. Displays as line chart with 24-hour history
5. Auto-refreshes every 60 seconds
```

**Fallback Strategy (Smart!):**
If no data from Stem051 in last 24h → try Stem136 in last 24h
If still no data → try both stems in last 7 days
If still nothing → try diameter data instead
This ensures something always shows!



**Design Decisions:**
- Live badge (⚡) shows real-time data
- Device name displayed so researcher knows which sensor
- Time range clearly shown
- Green color scheme matches plant theme

---

### Feature 6: Interactive Map (Line 858-898)

**What it shows:**
Exact location of the greenhouse on a real map using MapLibre.

**Features:**
- Satellite
- Marker at greenhouse location
- Zoom in/out controls
- Click marker to see details

**Technical Implementation:**
- Uses MapLibre GL (open-source mapping library)
- Coordinates from database (latitude, longitude)
- 16x zoom level for detailed view
- Custom marker shows greenhouse icon

**Why include a map?**
- Visual context of location
- Some regions have different climate
- Helps understand external factors
- Professional presentation tool

---

### Feature 7: PhytoSense Data Viewer

#### How We Connected to the PhytoSense API

**Architecture Overview:**

```
Frontend (React) → Backend API (Express) → PhytoSense External API
                   ↓
              PostgreSQL Cache (optional)
```

**Step-by-Step API Integration:**

**1. External API Connection**
- **Source**: PhytoSense 2GROW platform (https://cloud2grow.eu)
- **Authentication**: API token required for all requests
- **Endpoints**:
  - `/devices` - List available sensors
  - `/data/{tdid}` - Get measurements for specific sensor
- **Rate Limiting**: Maximum 60 requests per minute

**2. Backend Proxy Server** (`server/phytosense-proxy.js`)
```javascript
Purpose: Acts as intermediary between frontend and PhytoSense API
Location: /api/phytosense/*
```

**Why use a proxy?**
- Hides API credentials from frontend (security)
- Handles authentication automatically
- Adds data aggregation layer
- Implements caching to reduce API calls
- Provides consistent error handling

**3. Authentication Flow**
```
1. User logs into our platform → Gets JWT token
2. Frontend sends request with our JWT token
3. Backend validates our JWT token
4. Backend adds PhytoSense API token to request
5. Backend forwards to PhytoSense API
6. Response flows back through proxy to frontend
```

**4. Data Aggregation Engine**

**Problem**: PhytoSense API returns raw data (every 5 minutes = 105,120 points/year)

**Solution**: Backend aggregates before sending to frontend

```javascript
Query Parameters:
- tdid: Sensor ID (e.g., 33385)
- setup_id: Device setup (e.g., 1324)
- channel: Measurement channel (usually 0)
- after: Start date (ISO 8601)
- before: End date (ISO 8601)
- aggregation: hourly | 6hour | daily | weekly
```

**Backend Processing:**
```
1. Receives aggregation parameter from frontend
2. Fetches raw data from PhytoSense API
3. Groups data by time interval:
   - Hourly: Average every 12 points (5min × 12 = 1 hour)
   - 6-hour: Average every 72 points
   - Daily: Average every 288 points
   - Weekly: Average every 2,016 points
4. Returns reduced dataset to frontend
```

**5. Frontend Request Flow** (`src/components/phytosense/PhytoSenseOptimized.tsx`)

```javascript
// Example API call
const response = await fetch(
  `${API_URL}/phytosense/data/${tdid}?` +
  `setup_id=${setupId}&` +
  `channel=0&` +
  `after=${startDate}&` +
  `before=${endDate}&` +
  `aggregation=hourly`,
  {
    headers: {
      'Authorization': `Bearer ${userToken}`,
      'Content-Type': 'application/json'
    }
  }
);

const result = await response.json();
// Result contains aggregated data ready for charting
```

**6. Smart Aggregation Selection**

Frontend automatically chooses aggregation level:
```javascript
Date Range         → Aggregation → Max Points
≤7 days           → hourly       → ~168 points
8-30 days         → hourly       → ~720 points
31-90 days        → 6hour        → ~360 points
91-365 days       → daily        → ~365 points
>365 days         → weekly       → ~52 points
```

**7. Error Handling & Resilience**

**Network Failures:**
- Timeout after 30 seconds
- Retry logic (3 attempts with exponential backoff)
- Clear error messages to user

**Data Gaps:**
- If one measurement type fails, continue with the other
- Show partial data instead of complete failure
- Indicate data quality in UI

**API Rate Limits:**
- Cache responses for 5 minutes
- Debounce rapid requests
- Queue requests if needed

**8. Performance Optimizations**

**Caching Strategy:**
- Browser localStorage: Saves last selected device
- Backend memory cache: 5-minute TTL for identical requests
- Database cache (future): Store processed data

**Request Optimization:**
- Parallel fetches for diameter + sap flow
- Cancel pending requests when user changes selection
- Lazy loading: Only fetch when user clicks "Fetch Data"

**Data Streaming (Advanced):**
- For very large datasets (>1 year), could implement streaming
- Not currently needed due to aggregation

**9. Security Measures**

**Token Protection:**
- PhytoSense API token stored in backend `.env` file
- Never exposed to frontend
- Backend validates user JWT before forwarding request

**Input Validation:**
- Date ranges validated (must be within 2022-2024)
- Sensor IDs verified against allowed list
- SQL injection prevention (parameterized queries)

**Rate Limiting:**
- Per-user limits (100 requests/hour)
- Global limits (1000 requests/hour)
- Prevents API abuse

**10. Data Response Format**

```javascript
// PhytoSense API returns:
{
  "success": true,
  "data": [
    {
      "dateTime": "2024-10-15T12:00:00Z",
      "value": 45.3,
      "unit": "g/h"
    },
    // ... more points
  ],
  "metadata": {
    "tdid": 39987,
    "setup_id": 1508,
    "aggregation": "hourly",
    "points": 168
  }
}
```

**What it does:**
Displays historical plant sensor data from 2022-2024 with smart performance optimization.

**Available Devices:**
- 8 different sensors across 3 years

- Two measurement types:
  1. Stem diameter (mm) - thickness of plant stem
  2. Sap flow (g/h) - water movement rate

**Key Features:**

**1. Device Selector**
- Choose from 8 sensors spanning 2022-2024
- Each labeled with crop type and time period
- Shows date range of available data

**2. Measurement Type Toggle**
- View both metrics together
- View only diameter
- View only sap flow

**3. Smart Date Ranges**
- Last 7 days
- Last 30 days
- Last 90 days
- Last year
- Full device period (can be years!)
- Custom range (pick exact dates)

**4. Smart Aggregation 

This is the clever part that makes it fast:

**Problem:**
If you load 2 years of hourly data, that's 17,520 data points. Browser crashes!

**Solution:**
Auto-aggregation based on time range:
- ≤7 days: Show every hour (168 points max)
- 8-30 days: Show every hour (720 points max)
- 31-90 days: Show every 6 hours (360 points max)
- 91-365 days: Show daily averages (365 points max)
- >365 days: Show weekly averages

**Why this works:**
- Human eye can't distinguish 17,000 points on a chart
- Averaging doesn't lose meaningful patterns
- Fast loading and smooth interaction
- Can still drill down for details if needed

**5. Export to Excel**
- One-click download
- Includes all chart data
- Info sheet with metadata
- Timestamped filename

**Design Decisions:**

**Why two Y-axes?**
- Diameter (mm) and sap flow (g/h) use different scales
- Left axis = diameter (green line)
- Right axis = sap flow (blue line)
- Prevents one metric from being too small to see

**Why advanced mode?**
- Most users use "auto" and it just works
- Power users can override (force hourly even for long periods)
- Dropdown hidden by default to avoid confusion

**Error Handling:**
- Shows clear error messages
- Continues with partial data if one sensor fails
- Warns if no data available
- Suggests alternative date ranges

---

## Slide 6: Design Principles (3 minutes)

### 1. User-Centered Design
- **Big numbers** for important metrics (easy to read from distance)
- **Color coding** for quick understanding (green=good, red=alert)
- **Emoji icons** for visual recognition without reading

### 2. Responsive Layout
- Works on desktop, tablet, and mobile
- Grid system adapts to screen size
- Touch-friendly buttons on mobile

### 3. Performance Optimization
- **Lazy loading**: Only loads data when needed
- **Smart aggregation**: Reduces data points without losing insights
- **Caching**: Remembers your selections

### 4. Error Resilience
- **Fallback strategies**: Tries alternative data sources
- **Graceful degradation**: Shows partial data if some fails
- **Clear error messages**: Tells user exactly what's wrong

### 5. Data Visualization Best Practices
- **Line charts** for time-series (temperature over time)
- **Area charts** for trends (growth predictions)
- **Interactive tooltips** on hover
- **Legend** clearly labels each line

---

## Slide 7: Key Design Decisions & Reasoning (3 minutes)

### Decision 1: Auto-refresh every 60 seconds
**Why?**
- Sap flow changes throughout the day
- Researchers want "live" feel
- Not so fast it distracts (avoided 5-second refresh)

### Decision 2: Multiple fallback sensors
**Why?**
- Sensors sometimes go offline
- Historical data may have gaps
- Better to show old data than nothing
- Researchers can see data quality indicator

### Decision 3: Store greenhouse selection
**Why?**
- Researchers usually work with one greenhouse
- Annoying to re-select every time
- Uses localStorage (persists across sessions)

### Decision 4: Weather from Open-Meteo API
**Why?**
- **Free and no API key** - Easy setup, no registration
- **ECMWF models** - High-quality European weather forecasts
- **KNMI station coordinates** - Uses official Dutch weather station locations for accuracy
- **Reliable and fast** - Good uptime, 10-minute refresh interval

### Decision 5: JWT with 24-hour expiry + 7-day refresh token
**Why?**
- **UX**: Researchers can monitor greenhouses all day without re-login
- **Security**: Still expires after 24 hours if stolen
- **Refresh token**: 7-day validity for extended sessions
- **Best practice**: Balances security with usability for monitoring dashboards

### Decision 6: TypeScript instead of JavaScript
**Why?**
- Catches errors while coding (before users see them)
- Makes code self-documenting (types show what's expected)
- Better IDE support (autocomplete, refactoring)

### Decision 7: Component-based architecture
**Why?**
- Each feature is self-contained
- Easy to test individually
- Can reuse components (e.g., Card component used everywhere)
- Easy to maintain and update

### Decision 8: Real-time + Historical balance
**Why?**
- Real-time: Sap flow updates every 60s (urgent for active monitoring)
- Historical: PhytoSense viewer (research/analysis)
- Different use cases need different approaches

---

## Slide 8: Technical Challenges Solved (2 minutes)

### Challenge 1: Too much data crashes browser
**Solution:** Smart aggregation algorithm (explained earlier)

### Challenge 2: Sensor data has gaps
**Solution:** Multi-device fallback strategy + data quality indicators

### Challenge 3: Multiple greenhouses to manage
**Solution:** Centralized selector + saved preference

### Challenge 4: Different users need different data
**Solution:** Role-based routing (researcher vs grower dashboards)

### Challenge 5: Real-time updates without WebSockets
**Solution:** Polling with setInterval (simple, works everywhere)

### Challenge 6: TypeScript strict mode errors
**Solution:** Proper type definitions for all data structures

---

## Slide 9: Future Improvements (1 minute)

### What could be added:
1. **WebSocket integration** for true real-time (no polling)
2. **Machine learning models** for better predictions
3. **Alert system** (push notifications when problems detected)
4. **Mobile app** (React Native version)
5. **Data export** in more formats (PDF reports, CSV bulk export)
6. **Comparison tools** (compare two greenhouses side-by-side)
7. **Historical alerts** (show when issues occurred in past)

---

## Slide 10: Summary & Demo (1 minute)

### What We Built:
A professional greenhouse monitoring platform with:
- Secure authentication system
- Real-time sensor data visualization
- Weather integration
- AI predictions
- Historical data analysis
- Multi-greenhouse support
- Responsive, beautiful UI

### Key Achievements:
- Handled 3+ years of sensor data without crashes
- Smart fallback systems ensure data always shows
- Professional design with attention to detail
- Production-ready code with TypeScript
- Comprehensive database schema
- Role-based access control

### Technologies Mastered:
- React + TypeScript
- PostgreSQL + TimescaleDB
- JWT authentication
- REST API design
- Data visualization
- Responsive design
- Performance optimization

---

## Q&A Preparation

### Expected Questions:

**Q: Why not use WebSockets for real-time data?**
A: Polling with setInterval is simpler to implement and debug. For 60-second updates, WebSockets would be overkill. Would consider for sub-second updates.

**Q: How do you handle sensor failures?**
A: Multi-level fallback strategy tries alternative sensors and time ranges. Clear error messages guide user to working data sources.

**Q: Why separate dashboards for researchers vs growers?**
A: Different roles need different information. Researchers care about sensor details, growers care about financials. Keeps interfaces focused.

**Q: How does aggregation maintain data accuracy?**
A: We use averages over intervals. For most research purposes (identifying trends, comparing periods), averages are sufficient and actually reduce noise.

**Q: Can you add more greenhouses?**
A: Yes! Database is designed for unlimited greenhouses. Just add row to `greenhouses` table and it appears in selector.

**Q: Is the code production-ready?**
A: Frontend is very close. Backend needs rate limiting, better error handling, and monitoring. Database schema is production-ready.

---

## Demonstration Flow (if time permits)

1. **Login** (show JWT token in localStorage)
2. **Select Greenhouse** (show data loads dynamically)
3. **View Weather** (point out Open-Meteo API with KNMI stations)
4. **Check Sap Flow** (show live badge, explain update interval)
5. **View Predictions** (explain confidence scores)
6. **Open PhytoSense Viewer**:
   - Select different device
   - Change date range
   - Show aggregation change
   - Export to Excel
7. **Logout** (show token cleared)

---

## Talking Points for Each Section

### Introduction (30 seconds)
"I worked on a smart greenhouse platform that helps researchers monitor plant health using real-time sensors and AI predictions."

### Technology Stack (45 seconds)
"We used modern web technologies - React for the interface, PostgreSQL for data storage, and TypeScript to catch errors early."

### Authentication (45 seconds)
"The login system uses JWT tokens, which are like secure tickets that prove you're logged in. They expire after 15 minutes for security."

### Database (30 seconds)
"We store millions of sensor readings using TimescaleDB, which is optimized for time-series data like temperatures and plant measurements."

### Researcher Dashboard (10 minutes)
"This is the heart of the project. Let me walk you through each feature..."

[Spend most time here, explaining each feature in detail]

### Design Decisions (2 minutes)
"Every design choice had a reason. For example, we use auto-refresh every 60 seconds because..."

### Challenges (1 minute)
"The biggest challenge was handling years of data without crashing the browser. We solved this with smart aggregation..."

### Conclusion (30 seconds)
"In summary, we built a production-ready platform that researchers can use to monitor greenhouses, analyze plant data, and make better decisions."

---

## Visual Aids Suggestions

1. **Architecture Diagram**: Show Frontend → Backend → Database flow
2. **Screenshots**: Each major feature of researcher dashboard
3. **Data Flow Diagram**: How sap flow data moves from sensor to chart
4. **Before/After**: Show problem (17,520 points) vs solution (168 points with aggregation)
5. **User Journey**: Login → Select Greenhouse → View Data → Export

---

## Time Allocation (30 minutes total)

- Introduction: 2 min
- Technology Stack: 3 min
- Login System: 3 min
- Database: 2 min
- **Researcher Dashboard: 15 min** ⭐
- Design Decisions: 3 min
- Challenges & Solutions: 2 min

Total: 30 minutes

---

## Key Takeaways for Audience

1. **Full-stack development** - Worked on frontend, backend, and database
2. **Real-world problem solving** - Handled performance issues, data gaps, user experience
3. **Modern best practices** - TypeScript, responsive design, security
4. **User-centered design** - Every feature serves researcher needs
5. **Production quality** - Not just a prototype, but deployment-ready code

---

## Personal Reflection Notes

**What went well:**
- Performance optimization (aggregation strategy)
- Fallback systems (always shows data)
- Clean, professional UI
- Type safety caught many bugs

**What was challenging:**
- Learning TypeScript strict mode
- Understanding time-series database concepts
- Balancing feature richness with simplicity

**What I learned:**
- Full-stack development workflow
- Real-time data handling
- Database design for IoT
- React performance optimization
- User experience design

---

## Additional Context for Questions

**About the data:**
- Real sensor data from PhytoSense (2GROW system)
- Measurements every 5 minutes for some sensors, hourly for others
- Different crops: tomato, cucumber
- Time span: 2022-2024
- Multiple greenhouses in Netherlands

**About the users:**
- Researchers at agricultural institutions
- Need detailed, accurate data for experiments
- Value reliability over flashy features
- Often compare different conditions/varieties

**About the tech choices:**
- React: Most popular, great ecosystem
- TypeScript: Industry standard for large apps
- PostgreSQL: Reliable, well-documented
- TimescaleDB: Purpose-built for time-series
- Tailwind: Fast development, consistent design

---

END OF PRESENTATION NOTES
 Critical Analysis for 2grow Expert Audience

  MAJOR ISSUE: Audience Mismatch

  Your presentation is currently written for a general technical audience, but you're presenting to 2grow experts who
  already know their own technology inside-out. This needs significant adjustment.

  Problems with Current Approach:

  1. Over-explaining their own technology (Lines 198-232)
  ❌ "What it measures: Water flow through plant stems"
  ❌ "Sap flow (g/h) - how fast water moves"
  ❌ "Stem diameter (μm) - thickness of stem"
  They invented this technology! They don't need you to explain what sap flow is.

  2. Describing their API back to them (Lines 274-280)
  ❌ "Source: PhytoSense 2GROW platform (https://cloud2grow.eu)"
  ❌ "Authentication: API token required for all requests"
  ❌ "Rate Limiting: Maximum 60 requests per minute"
  They built this API! They know how it works.

  3. Too much time on basics, not enough on YOUR contribution
  - 15 minutes planned for researcher dashboard
  - But much of it explains PhytoSense technology
  - Should focus on YOUR implementation and value-add

  ---
  What 2grow Experts Actually Want to See:

  1. HOW you used their API (not what it is)
  - Show the integration architecture
  - Demonstrate the proxy server implementation
  - Explain WHY you made certain design choices
  - Show code examples of your implementation

  2. PROBLEMS you solved
  - ✅ Aggregation strategy (this is good!)
  - ✅ Performance optimization (keep this!)
  - ✅ Error handling and fallbacks (excellent!)
  - Missing: Any API limitations you encountered?

  3. VALUE you added on top of their data
  - The researcher dashboard design
  - Multi-greenhouse comparison capability
  - Integration with weather data
  - Predictive analytics
  - Export functionality
  - How you made their data MORE useful

  4. INSIGHTS from their data
  - What patterns did you discover?
  - How do researchers use the data?
  - What features do researchers request?
  - How does sap flow correlate with other metrics?

  5. FEEDBACK on their API (respectfully)
  - What worked well?
  - What was challenging?
  - Suggestions for improvement?
  - Feature requests?

  ---
  Recommended Restructure for 2grow Audience:

  Slide 1: Project Overview (2 min)
  - ✅ Keep but reframe: "I built a platform around your sensors"
  - Focus on the broader ecosystem, not just PhytoSense

  Slide 2: Platform Architecture (3 min)
  - Show how PhytoSense fits into larger system
  - Integration points: Weather, predictions, database, UI
  - Emphasize: Your sensors are the core, we built the platform around them

  Slide 3: Integration Implementation (4 min) ⭐ NEW FOCUS
  - Backend proxy architecture (phytosense-proxy.js)
  - Authentication flow
  - Error handling strategy
  - Caching implementation
  - Show actual code snippets

  Slide 4: Aggregation Strategy (4 min) ⭐ KEEP & EXPAND
  - This is YOUR innovation on top of their data
  - Show the math: 105,120 points → 168 points
  - Performance benchmarks
  - They'll appreciate this technical depth

  Slide 5: Researcher Dashboard UX (8 min) ⭐ YOUR VALUE-ADD
  - Focus on UI/UX decisions
  - How researchers interact with their data
  - Device selector, date range, measurement toggles
  - Export functionality
  - Show screenshots/demo, not explanations of sap flow

  Slide 6: Multi-System Integration (3 min)
  - PhytoSense + Weather + Predictions + Database
  - How different data sources complement each other
  - Example: Sap flow patterns vs weather conditions

  Slide 7: Challenges & Solutions (3 min)
  ✅ "Your API sometimes has data gaps, so we implemented..."
  ✅ "To handle large date ranges, we developed..."
  ✅ "For better UX, we added fallback logic..."
  ⚠️ NOT: "Sap flow is water movement in plants..."

  Slide 8: User Feedback & Future (3 min)
  - What researchers love about the platform
  - Feature requests from users
  - Potential enhancements
  - Maybe: API feedback/suggestions for 2grow team

  ---
  Specific Line-by-Line Issues:

  Lines 198-232: Plant Monitoring - Sap Flow
  - ❌ "What it measures: Water flow through plant stems"
  + ✅ "Integration with PhytoSense API - Implementation Details"

  - ❌ "Sap flow (g/h) - how fast water moves"
  + ✅ "Real-time visualization of stem diameter and sap flow measurements"

  - ❌ "This is important because plants drink more when..."
  + ✅ "Fallback strategy: Try Stem051 → Stem136 → 7-day window → diameter data"

  Lines 260-439: PhytoSense Data Viewer
  - ❌ "Two measurement types: Stem diameter (mm), Sap flow (g/h)"
  + ✅ "Historical data visualization component with smart aggregation"

  Keep the technical implementation details (lines 305-439) ✅
  These show YOUR work, not theirs

  Lines 600-625: About the data
  - ❌ "About the data: Real sensor data from PhytoSense (2GROW system)"
  - ❌ "Measurements every 5 minutes for some sensors"
  + ✅ "Data integration challenges and solutions"
  + ✅ "Performance optimizations for multi-year datasets"

  ---
  What to Emphasize:

  ✅ KEEP & EXPAND:
  1. Aggregation algorithm (lines 293-312) - This is brilliant
  2. Error handling (lines 368-383) - Shows robust engineering
  3. Performance optimizations (lines 385-399) - Technical depth
  4. Security measures (lines 401-416) - Professional approach
  5. Smart fallback strategy - Shows you understand the data

  ✅ ADD:
  1. Live demo of researcher dashboard
  2. Screenshots of the UI
  3. Code walkthrough of your proxy server
  4. Performance benchmarks (before/after aggregation)
  5. User testimonials or feedback
  6. Future collaboration opportunities

  ❌ REMOVE or MINIMIZE:
  1. Basic explanations of PhytoSense technology
  2. Descriptions of what sap flow is
  3. API endpoint documentation (they wrote it!)
  4. "Why this matters" for PhytoSense features (they know!)

  ---
  Tone Adjustment:

  Current tone:
  "PhytoSense sensors measure sap flow, which is important because..."

  Better tone for experts:
  "We integrated your sap flow API into our platform using a proxy server that handles authentication and implements smart
   aggregation to optimize performance for large historical datasets."

  Current:
  "What it measures: Water flow through plant stems"

  Better:
  "We visualize your sensor data with dual Y-axis charts to accommodate the different scales of diameter and sap flow 
  measurements."

  ---
  Demo Strategy:

  Since it's a 30-minute presentation to experts, I'd recommend:

  10 minutes: Context
  - Your project goals
  - Platform architecture
  - How PhytoSense fits in

  15 minutes: Live Demo ⭐
  - Show the actual dashboard
  - Walk through the code
  - Demonstrate the features YOU built
  - Show the value YOU added

  5 minutes: Technical Deep Dive
  - Aggregation algorithm
  - Performance metrics
  - Integration challenges

  ---
  Questions They Might Ask:

  Be prepared for:
  1. "Why did you choose this aggregation approach over X?"
  2. "Have you encountered any API limitations?"
  3. "What do researchers say about our data?"
  4. "What features would make the API better for your use case?"
  5. "How does our data compare to other sensor types?"
  6. "What's the performance impact of the proxy layer?"
  7. "Have you considered caching strategies?"

⏺ ---
  Summary: 3 Critical Changes Needed

  1. REFRAME THE NARRATIVE
  - From: "Let me explain PhytoSense technology to you"
  - To: "Here's the platform I built around your sensors"

  2. SHIFT THE FOCUS
  - From: 60% explaining their tech, 40% your work
  - To: 20% context, 80% YOUR implementation and value-add

  3. DEMONSTRATE, DON'T EXPLAIN
  - Less: "Sap flow measures water movement"
  - More: "Here's how researchers interact with your data in our dashboard"

  ---
  Would you like me to:
  1. Rewrite specific sections for the 2grow audience?
  2. Create a new presentation outline optimized for experts?
  3. Help prepare for specific technical questions they might ask?

  The good news: Your technical implementation (aggregation, error handling, proxy server) is excellent. You just need to
  reframe the presentation to showcase YOUR work rather than explaining their technology back to them.