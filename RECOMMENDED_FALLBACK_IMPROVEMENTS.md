# Recommended Improvements for Sap Flow Fallback System

## Problem Analysis

The current implementation (lines 244-260 in ResearcherDashboard.tsx) falls back to showing diameter data when sap flow is unavailable. This is problematic because:

1. **Data Integrity Issues**: Mixing different measurement types (g/h vs μm) can mislead researchers
2. **Trust Erosion**: Researchers expect to see what they requested, not alternative data
3. **Scientific Validity**: Diameter changes don't directly correlate with sap flow patterns
4. **UI Confusion**: Even though the UI labels change, researchers might not notice and misinterpret the data

## Recommended Solution

### Option 1: Show Last Known Good Value (Preferred)

```typescript
// In ResearcherDashboard.tsx, replace lines 244-260 with:

interface CachedSensorData {
  value: number;
  timestamp: string;
  deviceName: string;
  dataPoints?: Array<{time: string; value: number}>;
}

// Add to component state
const [lastKnownSapFlow, setLastKnownSapFlow] = useState<CachedSensorData | null>(
  localStorage.getItem('lastKnownSapFlow')
    ? JSON.parse(localStorage.getItem('lastKnownSapFlow')!)
    : null
);

// Modified fallback logic
if (!fetchedData) {
  console.log('No current sap flow data available');

  // Option 1: Use cached last known good value
  if (lastKnownSapFlow) {
    const hoursSinceLastData = Math.floor(
      (Date.now() - new Date(lastKnownSapFlow.timestamp).getTime()) / (1000 * 60 * 60)
    );

    setSapFlow({
      current: lastKnownSapFlow.value,
      unit: 'g/h',
      data: lastKnownSapFlow.dataPoints || [],
      lastUpdated: lastKnownSapFlow.timestamp,
      isLive: false,
      dataType: 'sap-flow',
      timeRange: `Last known (${hoursSinceLastData}h ago)`,
      deviceName: lastKnownSapFlow.deviceName
    });

    // Show warning banner
    setSapFlowError(
      `Sensor offline. Showing last known value from ${hoursSinceLastData} hours ago. ` +
      `Device: ${lastKnownSapFlow.deviceName}`
    );
  } else {
    // No cached data available
    setSapFlowError(
      'Sap flow sensors (Stem051 & Stem136) are currently offline. ' +
      'No historical data available. Please check sensor status.'
    );
  }

  setSapFlowLoading(false);
  return;
}

// When we successfully fetch data, cache it
if (fetchedData && fetchedData.dataType === 'sap-flow') {
  const cacheData: CachedSensorData = {
    value: currentValue,
    timestamp: new Date().toISOString(),
    deviceName: fetchedData.deviceName,
    dataPoints: chartData.slice(-24) // Keep last 24 points for mini chart
  };

  localStorage.setItem('lastKnownSapFlow', JSON.stringify(cacheData));
  setLastKnownSapFlow(cacheData);
}
```

### Option 2: Enhanced Status Display

```typescript
// Create a dedicated status component
const SensorStatusCard: React.FC<{status: 'online' | 'offline' | 'degraded'}> = ({ status }) => {
  const statusConfig = {
    online: {
      color: 'green',
      icon: '✓',
      message: 'All sensors operational',
      bgClass: 'bg-green-50 border-green-200'
    },
    offline: {
      color: 'red',
      icon: '✗',
      message: 'Sensors offline - check connection',
      bgClass: 'bg-red-50 border-red-200'
    },
    degraded: {
      color: 'yellow',
      icon: '⚠',
      message: 'Limited data available',
      bgClass: 'bg-yellow-50 border-yellow-200'
    }
  };

  const config = statusConfig[status];

  return (
    <div className={`rounded-lg p-4 border ${config.bgClass}`}>
      <div className="flex items-center space-x-2">
        <span className={`text-2xl text-${config.color}-600`}>{config.icon}</span>
        <div>
          <h4 className={`font-semibold text-${config.color}-900`}>
            Sensor Status: {status.charAt(0).toUpperCase() + status.slice(1)}
          </h4>
          <p className={`text-sm text-${config.color}-700`}>{config.message}</p>
        </div>
      </div>
    </div>
  );
};
```

### Option 3: Separate Dashboard Cards

Instead of mixing data types in one card, create separate cards for each measurement:

```typescript
// In the dashboard layout
<div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
  {/* Sap Flow Card - Always for sap flow only */}
  <SapFlowCard
    data={sapFlowData}
    loading={sapFlowLoading}
    error={sapFlowError}
  />

  {/* Diameter Card - Separate, optional display */}
  {showDiameterData && (
    <DiameterCard
      data={diameterData}
      loading={diameterLoading}
      error={diameterError}
    />
  )}
</div>
```

### Option 4: Historical Trend Fallback

When live data is unavailable, show historical patterns:

```typescript
const HistoricalTrendDisplay: React.FC<{deviceName: string}> = ({ deviceName }) => {
  const [historicalData, setHistoricalData] = useState(null);

  useEffect(() => {
    // Fetch last 30 days of data
    fetchHistoricalData(deviceName, 30).then(data => {
      setHistoricalData(data);
    });
  }, [deviceName]);

  return (
    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
      <h4 className="font-semibold text-blue-900 mb-2">
        Live Data Unavailable - Showing Historical Trend
      </h4>
      <p className="text-sm text-blue-700 mb-4">
        Based on last 30 days of {deviceName} sap flow data
      </p>
      {historicalData && (
        <MiniChart data={historicalData} height={150} />
      )}
      <button
        onClick={() => window.location.href = '#historical-viewer'}
        className="mt-3 text-blue-600 hover:text-blue-800 text-sm font-medium"
      >
        View full historical data →
      </button>
    </div>
  );
};
```

## Implementation Priority

1. **Immediate Fix** (High Priority):
   - Remove diameter fallback (lines 244-260)
   - Implement Option 1 (Last Known Good Value)
   - Add clear error messaging

2. **Short-term Enhancement** (Medium Priority):
   - Implement Option 2 (Enhanced Status Display)
   - Add sensor health monitoring endpoint

3. **Long-term Improvement** (Low Priority):
   - Implement Option 3 (Separate Cards)
   - Add Option 4 (Historical Trends)
   - Create sensor diagnostics page

## Benefits of This Approach

1. **Maintains Data Integrity**: Never shows wrong data type
2. **Builds Trust**: Transparent about data availability
3. **Better UX**: Clear status indicators and actionable messages
4. **Research Validity**: No risk of data misinterpretation
5. **Graceful Degradation**: Shows useful context even when offline

## Testing Considerations

```typescript
// Test scenarios to implement
describe('Sap Flow Data Fallback', () => {
  it('should show last known value when sensors offline', async () => {
    // Mock API to return empty
    mockAPI.returnEmpty();

    // Set localStorage with last known value
    localStorage.setItem('lastKnownSapFlow', JSON.stringify({
      value: 45.3,
      timestamp: new Date(Date.now() - 3600000).toISOString(),
      deviceName: 'Stem051'
    }));

    // Render component
    const { getByText } = render(<ResearcherDashboard />);

    // Should show last known value
    expect(getByText('45.3')).toBeInTheDocument();
    expect(getByText(/Last known \(1h ago\)/)).toBeInTheDocument();
  });

  it('should never show diameter when sap flow requested', async () => {
    // Mock API to return only diameter data
    mockAPI.returnOnlyDiameter();

    // Render component
    const { queryByText } = render(<ResearcherDashboard />);

    // Should NOT show diameter values
    expect(queryByText('μm')).not.toBeInTheDocument();
    expect(queryByText('Stem Diameter')).not.toBeInTheDocument();
  });
});
```

## Conclusion

The current fallback to diameter data, while well-intentioned, compromises data integrity and researcher trust. The recommended approach maintains transparency while providing useful information through cached data, clear status indicators, and historical context.

This change will:
- Prevent data misinterpretation
- Maintain researcher confidence in the platform
- Provide actionable information when sensors are offline
- Align with best practices for scientific data visualization