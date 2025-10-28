# PhytoSense Data Storage Architecture - Recommendation

## Current vs Recommended Approach

### Current (All Cache, No Storage)
```
User Request → Backend → PhytoSense API → Parse → Cache (RAM) → Return
                                                    ↓
                                           (Expires after TTL)
                                                    ↓
                                                 Deleted
```

**Issues:**
- Server restart = all cache lost
- Same historical query repeated daily = wasted API calls
- 2-year query = 60+ second wait, every time
- Dependent on PhytoSense API uptime

---

## Recommended: Hybrid Approach

### Architecture Diagram
```
┌─────────────────────────────────────────────────────────┐
│                    User Request                          │
│           "Show me Stem051, Jan-Dec 2023"               │
└────────────────────┬────────────────────────────────────┘
                     │
                     ▼
        ┌────────────────────────┐
        │  Backend Smart Router  │
        │  (Check data age)      │
        └────────┬───────────────┘
                 │
    ┌────────────┴─────────────┐
    │                          │
    ▼                          ▼
┌─────────────┐          ┌──────────────┐
│ Historical  │          │  Live/Recent │
│ Data Route  │          │  Data Route  │
│ (>7 days)   │          │  (<7 days)   │
└──────┬──────┘          └──────┬───────┘
       │                        │
       ▼                        ▼
┌──────────────┐          ┌─────────────┐
│ Database     │          │ Cache (RAM) │
│ First        │          │ 5-min TTL   │
└──────┬───────┘          └──────┬──────┘
       │                         │
       │ Miss? Fetch once        │ Miss? Fetch
       │         ↓               │      ↓
       └─────→ PhytoSense API ←──┘
               (2grow.eu)
```

### Data Flow by Age

#### Historical Data (> 7 days old)
```sql
-- 1. User requests 2023 data
SELECT * FROM sap_flow_measurements
WHERE sensor_code = 'stem051'
AND timestamp BETWEEN '2023-01-01' AND '2023-12-31';

-- 2. If data exists in DB:
   → Return immediately (50ms) ✅

-- 3. If data missing in DB:
   → Fetch from PhytoSense API (3000ms)
   → Store in database (INSERT)
   → Return to user

-- 4. Next request for same data:
   → Return from DB (50ms) ✅ No API call!
```

**Benefits:**
- 60x faster (50ms vs 3000ms)
- Works offline
- Respectful to 2grow API
- Historical data never changes, so safe to store

#### Live/Recent Data (< 7 days)
```typescript
// 1. User requests last 24 hours
const cacheKey = 'phytosense:stem051:live:24h';
let data = cache.get(cacheKey);

// 2. If cached (within 5 minutes):
if (data) {
  return data; // Instant ✅
}

// 3. If cache expired:
data = await phytoSenseAPI.fetch(...);
cache.set(cacheKey, data, 300); // 5-min cache
return data;

// 4. After 5 minutes, fetch again for freshness
```

**Benefits:**
- Always fresh (max 5 minutes old)
- No stale data in database
- Auto-refreshing (dashboard polls every 60s)

---

## Implementation Strategy

### Phase 1: Add Database Storage (Historical Only)

**New service**: `backend/src/services/phytosense-storage.service.ts`

```typescript
export class PhytoSenseStorageService {

  // Determine if data should be stored in DB
  private shouldStore(endDate: Date): boolean {
    const now = new Date();
    const daysSince = (now - endDate) / (1000 * 60 * 60 * 24);
    return daysSince > 7; // Only store historical (>7 days)
  }

  // Fetch with smart routing
  async fetchData(params: FetchParams): Promise<Data> {
    const { after, before, tdid } = params;

    // If requesting historical data
    if (this.shouldStore(new Date(before))) {

      // 1. Try database first
      const dbData = await this.getFromDatabase(params);
      if (dbData.length > 0) {
        console.log('✅ Returned from database (50ms)');
        return dbData;
      }

      // 2. Not in DB → Fetch from API
      console.log('⬇️ Fetching from PhytoSense API...');
      const apiData = await phytoSenseService.fetchData(tdid, params);

      // 3. Store in database for future requests
      await this.saveToDatabase(apiData, params);
      console.log('💾 Stored in database for future use');

      return apiData;
    }

    // If requesting live/recent data (< 7 days)
    // Use cache-only (current approach)
    return await phytoSenseService.fetchData(tdid, params); // Cache handled internally
  }

  // Get from database
  private async getFromDatabase(params: FetchParams): Promise<Data> {
    const result = await db.query(`
      SELECT timestamp, sap_flow_rate_gh as value
      FROM sap_flow_measurements
      WHERE sensor_code = $1
        AND timestamp >= $2
        AND timestamp <= $3
      ORDER BY timestamp ASC
    `, [params.sensorCode, params.after, params.before]);

    return result.rows;
  }

  // Save to database
  private async saveToDatabase(apiData: Data, params: FetchParams): Promise<void> {
    // Bulk insert using COPY or batch INSERT
    const values = apiData.data.map(point => ({
      timestamp: point.dateTime,
      greenhouse_id: params.greenhouseId,
      plant_id: params.plantId,
      sensor_code: params.sensorCode,
      sap_flow_rate_gh: point.value,
      stem_diameter_mm: point.diameter || null
    }));

    await db.query(`
      INSERT INTO sap_flow_measurements
      (timestamp, greenhouse_id, plant_id, sensor_code,
       sap_flow_rate_gh, stem_diameter_mm)
      VALUES ${values.map((_, i) => `($${i*6+1}, $${i*6+2}, $${i*6+3}, $${i*6+4}, $${i*6+5}, $${i*6+6})`).join(', ')}
      ON CONFLICT (timestamp, sensor_code) DO NOTHING
    `, values.flat());
  }
}
```

### Phase 2: Update Routes

**File**: `backend/src/routes/phytosense.routes.ts`

```typescript
// OLD
const result = await phytoSenseService.fetchData(tdid, params);

// NEW
const result = await phytoSenseStorageService.fetchData(tdid, params);
```

---

## Data Lifecycle

### Historical Data Example (2023 Full Year)

```
Day 1: User requests 2023 data
├─ Database: Empty
├─ Fetch from API: 3000ms, 105,120 points
├─ Aggregate to daily: 365 points
├─ Store in database
└─ Return to user: 3500ms total

Day 2: User requests same 2023 data
├─ Database: Has data ✅
├─ Query database: 50ms
└─ Return to user: 50ms total (70x faster!)

Day 30: Another user requests 2023 data
├─ Database: Still has data ✅
├─ Query database: 50ms
└─ Return to user: 50ms total (No API call!)

Month 12: Server restarts
├─ Cache: Cleared (empty)
├─ Database: Still has 2023 data ✅
├─ User requests 2023 data
└─ Return from DB: 50ms (No re-fetch needed!)
```

### Live Data Example (Last 24 Hours)

```
10:00 AM: User requests last 24h
├─ Cache: Empty
├─ Fetch from API: 2000ms
├─ Cache for 5 minutes
└─ Return to user: 2000ms

10:02 AM: Another user requests last 24h
├─ Cache: Has data (2 min old) ✅
└─ Return from cache: <1ms (No API call!)

10:06 AM: User refreshes dashboard
├─ Cache: Expired (> 5 min)
├─ Fetch fresh data from API: 2000ms
├─ Cache for 5 minutes
└─ Return to user: 2000ms (Fresh data!)

10:30 AM: Server restarts
├─ Cache: Cleared
├─ Database: Empty (live data not stored)
├─ Next request fetches fresh from API ✅
└─ Correct! Live data should always be fresh
```

---

## Performance Comparison

### Scenario 1: User Views 2023 Full Year (365 days)

| Approach | First Request | Subsequent Requests | After Server Restart |
|----------|---------------|---------------------|---------------------|
| **Current (Cache Only)** | 3500ms | 3500ms | 3500ms ❌ |
| **Recommended (DB Storage)** | 3500ms | 50ms ✅ | 50ms ✅ |

**API Calls Saved:** 99% reduction for historical queries

### Scenario 2: User Views Last 24 Hours (Live Data)

| Approach | First Request | Within 5 min | After 5 min |
|----------|---------------|--------------|-------------|
| **Current (Cache Only)** | 2000ms | <1ms | 2000ms |
| **Recommended (Same!)** | 2000ms | <1ms | 2000ms |

**No change** - Live data handled same way (cache-only)

---

## Storage Requirements

### Historical Data (3 years, 2 sensors)

```
Raw data points: 315,360 (3 years × 105,120 points/year)
After hourly aggregation: 26,280 points (3 years × 8,760 hours/year)

Storage per point:
- timestamp: 8 bytes
- greenhouse_id: 16 bytes (UUID)
- plant_id: 16 bytes (UUID)
- sensor_code: 20 bytes (VARCHAR)
- sap_flow_rate_gh: 8 bytes (DECIMAL)
- stem_diameter_mm: 8 bytes (DECIMAL)
Total: ~76 bytes per point

Total storage: 26,280 points × 76 bytes = 1.99 MB
```

**Answer: ~2 MB for 3 years of data** (negligible!)

---

## Cost-Benefit Analysis

### Without Database Storage (Current)

**Assumptions:**
- 10 researchers use platform daily
- Each views 2023 data once per day
- API call: 3 seconds average

**Daily:**
- API calls: 10
- Total wait time: 30 seconds
- Server time: 30 seconds × 10 days = 5 minutes/day

**Monthly:**
- API calls: 300
- Total wait time: 15 minutes
- Load on 2grow API: 300 requests/month

### With Database Storage (Recommended)

**Daily:**
- API calls: 1 (first request only)
- Total wait time: 3 seconds (first) + 0.5 seconds (9 others) = 3.5 seconds
- Server time saved: 26.5 seconds

**Monthly:**
- API calls: 30 (once per day for fresh ranges)
- Total wait time: 2 minutes (vs 15 minutes)
- Load on 2grow API: 30 requests/month (vs 300)
- **90% reduction in API load** ✅

---

## Migration Plan

### Step 1: Add Database Storage (No Breaking Changes)
- Implement storage service
- Start storing historical data when fetched
- Keep returning data same way (transparent to frontend)

### Step 2: Backfill Historical Data (Optional)
- Run one-time script to fetch and store all 2022-2024 data
- After this, all historical queries are instant

### Step 3: Monitor & Optimize
- Track cache hit rate
- Monitor database size
- Adjust TTL values based on usage

---

## Conclusion

### Recommended Approach: **Hybrid** ✅

| Data Type | Storage Strategy | TTL | Why |
|-----------|------------------|-----|-----|
| **Historical (>7 days)** | Database | Permanent | Fast, reliable, respectful |
| **Recent (1-7 days)** | Cache | 1 hour | Balance freshness & performance |
| **Live (<24 hours)** | Cache | 5 minutes | Always fresh, near real-time |

### Key Benefits

**For Users:**
- 70x faster historical queries
- Always fresh live data
- Works even during PhytoSense API downtime

**For 2grow:**
- 90% fewer API calls (respectful usage)
- Historical data fetched once, not repeatedly
- Live data still pulls fresh every 5 minutes

**For You (Developer):**
- Server restarts don't lose historical data
- Can analyze trends offline
- Lower hosting costs (fewer API calls = less bandwidth)
- More control over data

### Implementation Effort

- **Time**: 3-4 hours
- **Complexity**: Medium
- **Risk**: Low (backward compatible)
- **Payoff**: High (major performance boost)

---

**Ready to implement? I can write the code for you!**
