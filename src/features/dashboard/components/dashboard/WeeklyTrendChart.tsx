import { ComposedChart, Bar, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';
import { WeeklySLA } from '@/shared/data/mockData';

interface WeeklyTrendChartProps {
  data: WeeklySLA[];
}

const WeeklyTrendChart = ({ data }: WeeklyTrendChartProps) => {
  // Filter data yang memiliki value > 0 untuk perhitungan rata-rata
  const validData = data.filter(d => d.sla > 0);
  const avgSLA = validData.length > 0 
    ? validData.reduce((sum, d) => sum + d.sla, 0) / validData.length 
    : 0;
  
  // Handle empty data
  if (!data || data.length === 0) {
    return (
      <div className="bg-card rounded-lg p-6 card-shadow animate-slide-up">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg font-semibold text-foreground">Trend SLA AVG 4 Minggu</h3>
            <p className="text-sm text-muted-foreground">Performa mingguan bulan berjalan</p>
          </div>
        </div>
        <div className="h-64 flex items-center justify-center text-muted-foreground">
          <p className="text-sm">Tidak ada data</p>
        </div>
      </div>
    );
  }
  
  return (
    <div className="bg-card rounded-lg p-6 card-shadow animate-slide-up">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-lg font-semibold text-foreground">Trend SLA AVG 4 Minggu</h3>
          <p className="text-sm text-muted-foreground">Performa mingguan bulan berjalan</p>
        </div>
        <div className="text-right">
          <p className="text-2xl font-bold text-foreground">{avgSLA.toFixed(1)}%</p>
          <p className="text-xs text-muted-foreground">Rata-rata</p>
        </div>
      </div>
      
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={data} margin={{ top: 20, right: 10, left: -10, bottom: 0 }}>
            <CartesianGrid 
              strokeDasharray="3 3" 
              stroke="hsl(var(--chart-grid))" 
              vertical={false}
            />
            <XAxis 
              dataKey="week" 
              tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
              tickLine={false}
              axisLine={{ stroke: 'hsl(var(--border))' }}
            />
            <YAxis 
              domain={[0, 100]}
              tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
              tickLine={false}
              axisLine={false}
              tickFormatter={(value) => `${value}%`}
            />
            <Tooltip 
              content={({ active, payload, label }) => {
                if (active && payload && payload.length > 0) {
                  const value = payload[0].value as number;
                  return (
                    <div className="bg-card border border-border rounded-lg p-3 shadow-lg">
                      <p className="text-xs text-muted-foreground mb-1">{label}</p>
                      <p className="text-sm font-semibold text-foreground">
                        {value === 0 ? 'Tidak ada data' : `${value.toFixed(1)}%`}
                      </p>
                    </div>
                  );
                }
                return null;
              }}
            />
            <ReferenceLine 
              y={95.5} 
              stroke="hsl(var(--status-warning))" 
              strokeDasharray="5 5"
            />
            <Bar 
              dataKey="sla" 
              fill="hsl(var(--chart-bar))"
              radius={[4, 4, 0, 0]}
              barSize={50}
              label={{ 
                position: 'top', 
                fill: 'hsl(var(--foreground))',
                fontSize: 12,
                fontWeight: 600,
                formatter: (value: number) => value > 0 ? `${value.toFixed(1)}%` : ''
              }}
            />
            <Line 
              type="monotone" 
              dataKey="sla" 
              stroke="hsl(var(--chart-trend))"
              strokeWidth={3}
              dot={{ r: 5, fill: 'hsl(var(--chart-trend))', strokeWidth: 2, stroke: 'hsl(var(--card))' }}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default WeeklyTrendChart;
