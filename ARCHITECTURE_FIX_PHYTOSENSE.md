# PhytoSense Device Architecture - Problem & Solution

## Current Problem

### Issue 1: Devices Represent Different Crops
```
Stem051 - Tomato (Jun-Aug 2023)    ← Tomato plant
Stem051 - Cucumber (Aug-Oct 2023)  ← Different cucumber plant
Stem136 - Tomato (Jun-Aug 2023)    ← Different tomato plant
```

**Problem:** Fallback shouldn't mix crop types - tomato data ≠ cucumber data!

### Issue 2: Live Card Hardcoded to One Setup

**Current code** (`ResearcherDashboard.tsx`):
```typescript
// HARDCODED to setup 1508 (2023-2024 General)
const devices = [
  {
    name: 'Stem051',
    setupId: 1508,  // ← Always 1508!
    sapFlowTDID: 39987,
    ...
  },
  {
    name: 'Stem136',
    setupId: 1508,  // ← Always 1508!
    sapFlowTDID: 39981,
    ...
  }
];
```

**Problem:** When user selects a different greenhouse, live sap flow card doesn't update!

### Issue 3: No Link Between Greenhouses and PhytoSense Devices

Your database has:
- ✅ `greenhouses` table (with greenhouse info)
- ✅ `phytosense_devices` table (with sensor configs)
- ❌ No relationship between them!

**Result:** Can't determine which sensors belong to which greenhouse.

---

## Recommended Solution: Proper Architecture

### Step 1: Link PhytoSense Devices to Greenhouses

**Update database schema:**

```sql
-- Add greenhouse_id to phytosense_devices table
ALTER TABLE phytosense_devices
ADD COLUMN greenhouse_id UUID REFERENCES greenhouses(id);

-- Update existing devices with greenhouse mappings
-- (You'll need to manually map which devices belong to which greenhouse)

UPDATE phytosense_devices
SET greenhouse_id = (SELECT id FROM greenhouses WHERE name = 'Main Research Greenhouse')
WHERE setup_id = 1508; -- 2023-2024 devices

UPDATE phytosense_devices
SET greenhouse_id = (SELECT id FROM greenhouses WHERE name = 'Tomato Trial Greenhouse')
WHERE crop_type = 'Tomato';

UPDATE phytosense_devices
SET greenhouse_id = (SELECT id FROM greenhouses WHERE name = 'Cucumber Trial Greenhouse')
WHERE crop_type = 'Cucumber';
```

### Step 2: Update Backend Service

**New function**: `getDevicesByGreenhouse(greenhouseId)`

```typescript
// backend/src/services/phytosense.service.ts

/**
 * Get active PhytoSense devices for a specific greenhouse
 */
public async getDevicesByGreenhouse(greenhouseId: string): Promise<PhytoSenseDevice[]> {
  const result = await db.query(`
    SELECT
      setup_id,
      name,
      from_date,
      to_date,
      diameter_tdid,
      sapflow_tdid,
      crop_type
    FROM phytosense_devices
    WHERE greenhouse_id = $1
      AND is_active = TRUE
    ORDER BY from_date DESC
  `, [greenhouseId]);

  return result.rows;
}
```

### Step 3: Update Frontend Dashboard

**Fix the live sap flow card** to use selected greenhouse:

```typescript
// src/pages/ResearcherDashboard.tsx

// OLD (Hardcoded):
const devices = [
  { name: 'Stem051', setupId: 1508, ... },
  { name: 'Stem136', setupId: 1508, ... }
];

// NEW (Dynamic based on selected greenhouse):
const [availableDevices, setAvailableDevices] = useState<Device[]>([]);

useEffect(() => {
  if (!selectedGreenhouse) return;

  const fetchDevices = async () => {
    const response = await fetch(
      `${API_URL}/phytosense/devices/greenhouse/${selectedGreenhouse.id}`,
      { headers: { 'Authorization': `Bearer ${token}` } }
    );
    const result = await response.json();
    setAvailableDevices(result.data);
  };

  fetchDevices();
}, [selectedGreenhouse]);

// Fallback logic now uses devices from the SAME greenhouse only
const fetchSapFlowData = async () => {
  for (const device of availableDevices) {
    // Try each device from THIS greenhouse
    const data = await fetchData(device.sapFlowTDID, device.setupId);
    if (data && data.length > 0) {
      displayData(data, device);
      return; // Success!
    }
  }
};
```

### Step 4: Smart Fallback Rules

**Fallback should respect context:**

```typescript
// Rule 1: Only fallback within same greenhouse
if (device1.greenhouseId !== device2.greenhouseId) {
  // NEVER fallback across greenhouses
  continue;
}

// Rule 2: Only fallback within same crop type (if specified)
if (device1.cropType !== 'General' && device1.cropType !== device2.cropType) {
  // Don't show tomato data when cucumber is selected
  continue;
}

// Rule 3: Prefer same time period
if (Math.abs(device1.fromDate - device2.fromDate) > 30 days) {
  // Warn user: "Showing data from different time period"
}
```

---

## Alternative: Simpler Short-Term Fix

If you don't want to restructure the database right now:

### Option A: Remove Fallback Across Crop Types

```typescript
// Only fallback if crop types match
const compatibleDevices = allDevices.filter(d =>
  d.cropType === selectedDevice.cropType ||
  d.cropType === 'General' ||
  selectedDevice.cropType === 'General'
);

// Only try fallback within compatible devices
for (const device of compatibleDevices) {
  // Try fetching...
}
```

### Option B: Separate Historical vs Live Views

**Historical Viewer** (PhytoSenseOptimized.tsx):
- Keep as-is: User manually selects device
- No fallback needed (user chose specifically)

**Live Sap Flow Card** (ResearcherDashboard.tsx):
- Make it configurable per greenhouse
- Add UI to select which device to monitor
- Show device info clearly: "Monitoring: Stem051 (Tomato, Setup 1508)"

---

## What to Tell the 2grow Expert

**During presentation, be honest:**

> "Currently, our live sap flow card is hardcoded to one experimental setup (1508 - your 2023-2024 general crop data). We have 8 devices in the system spanning different crops and time periods.
>
> For the next iteration, we plan to properly link your PhytoSense sensors to specific greenhouses in our system, so the live card automatically shows the correct sensors for whichever greenhouse the researcher is viewing.
>
> Our fallback system currently works well within a single setup (Stem051 → Stem136 for the same greenhouse), but we want your input on how to handle cross-crop fallbacks. Should we show cucumber data if tomato sensors are offline, or just show 'No data' instead?"

**They'll appreciate:**
- Your honesty about the current limitation ✅
- Your understanding that crop types shouldn't mix ✅
- Asking for their domain expertise ✅

---

## Recommended Immediate Action

### For Your Presentation (This Week):

1. **Update presentation** to clarify:
   - "Live card currently shows setup 1508 (2023-2024 general crop)"
   - "Historical viewer lets researchers explore all 8 devices"
   - "Fallback only tries devices from the same setup/crop"

2. **Demo strategy**:
   - Show the historical viewer (works well, user picks device)
   - Show live card (mention it's currently locked to one setup)
   - Ask for their feedback on device-greenhouse mapping

### After Presentation (Next Sprint):

1. Add `greenhouse_id` column to `phytosense_devices`
2. Create mapping: Which sensors belong to which greenhouses
3. Update API to filter devices by greenhouse
4. Update dashboard to use dynamic device list
5. Add UI to show which device is currently displayed

---

## Summary

**You're absolutely right:**
- ❌ Showing cucumber data when viewing tomato greenhouse = Bad
- ❌ Hardcoded device list = Not scalable
- ❌ No greenhouse-device relationship = Architectural gap

**The fix:**
- ✅ Link devices to greenhouses in database
- ✅ Dynamic device list based on selected greenhouse
- ✅ Fallback only within same greenhouse + crop type
- ✅ Clear UI showing which device/crop is displayed

**Estimated effort:** 4-6 hours to implement properly

Want me to implement this fix?
