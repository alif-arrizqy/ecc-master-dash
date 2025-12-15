# SLA Dashboard API Hooks

This directory contains React Query hooks for fetching SLA dashboard data.

**Note:** The API service uses Axios for HTTP requests with built-in interceptors for error handling and request configuration.

## Usage Examples

### 1. Daily SLA Chart by Battery Version

```tsx
import { useDailySLAChartByBatteryVersion } from '@/hooks/useSLAQueries';

function Talis5Chart() {
  const { data, isLoading, error } = useDailySLAChartByBatteryVersion(
    'talis5',
    {
      startDate: '2025-11-01',
      endDate: '2025-11-30',
    }
  );

  if (isLoading) return <div>Loading...</div>;
  if (error) return <div>Error: {error.message}</div>;

  return <DailySLAChart data={data} title="Talis5 Full" />;
}
```

### 2. Daily SLA Chart All Sites

```tsx
import { useDailySLAChartAllSites } from '@/hooks/useSLAQueries';

function AllSitesChart() {
  const { data, isLoading } = useDailySLAChartAllSites({
    startDate: '2025-11-01',
    endDate: '2025-11-30',
  });

  // data is transformed to { day: number, sla: number }[] format
  return <DailySLAChart data={data} title="All Sites" />;
}
```

### 3. Monthly Report Summary

```tsx
import { useMonthlyReportSummary } from '@/hooks/useSLAQueries';

function SummaryCard() {
  const { data, isLoading } = useMonthlyReportSummary('2025-12');
  // or use Indonesian format: 'desember 2025'

  if (isLoading) return <div>Loading...</div>;

  return (
    <div>
      <p>Total Sites: {data.summary.totalSite}</p>
      <p>SLA: {data.summary.sla}%</p>
      <p>Status: {data.summary.slaStatus}</p>
    </div>
  );
}
```

### 4. SLA Reasons

```tsx
import { useSLAReasons } from '@/hooks/useSLAQueries';

function SLACausesList() {
  const { data, isLoading } = useSLAReasons('talis5');

  if (isLoading) return <div>Loading...</div>;

  return (
    <ul>
      {data.map((reason) => (
        <li key={reason.id}>{reason.reason}</li>
      ))}
    </ul>
  );
}
```

### 5. GAMAS History with Pagination

```tsx
import { useGAMASHistory } from '@/hooks/useSLAQueries';

function GAMASHistoryList() {
  const [page, setPage] = useState(1);
  const { data, isLoading } = useGAMASHistory({
    startDate: '2025-11-01',
    endDate: '2025-11-30',
    page,
    limit: 20,
  });

  if (isLoading) return <div>Loading...</div>;

  return (
    <div>
      {data.data.map((item) => (
        <div key={item.id}>
          <p>{item.date}: {item.description}</p>
        </div>
      ))}
      {data.pagination && (
        <div>
          Page {data.pagination.page} of {data.pagination.totalPages}
        </div>
      )}
    </div>
  );
}
```

## Environment Variables

Set the API base URL in your `.env` file:

```env
VITE_API_BASE_URL=http://your-api-url.com
```

If not set, it defaults to `http://localhost:3000`.

## Battery Versions

Valid battery version values:
- `'talis5'` - Talis5 Full
- `'mix'` - Talis5 Mix
- `'jspro'` - JSPro

