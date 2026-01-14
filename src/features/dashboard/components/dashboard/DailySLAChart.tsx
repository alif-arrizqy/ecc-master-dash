import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine, LabelList } from 'recharts';
import { DailySLA } from '@/shared/data/mockData';

interface DailySLAChartProps {
  data: DailySLA[];
  title: string;
  color?: string;
  variant?: 'default' | 'talis5Full' | 'talis5Mix' | 'jsPro';
}

const variantColors = {
  default: 'hsl(217, 91%, 50%)',
  talis5Full: 'hsl(217, 91%, 50%)',
  talis5Mix: 'hsl(173, 80%, 40%)',
  jsPro: 'hsl(245, 58%, 51%)',
};

const CustomLabel = (props: { x?: number; y?: number; value?: number }) => {
  const { x, y, value } = props;
  
  if (x === undefined || y === undefined || value === undefined) {
    return null;
  }
  
  return (
    <text
      x={x}
      y={y - 10}
      fill="hsl(var(--foreground))"
      fontSize={14}
      fontWeight={600}
      textAnchor="middle"
    >
      {value.toFixed(0)}
    </text>
  );
};

const DailySLAChart = ({ data, title, variant = 'default' }: DailySLAChartProps) => {
  const lineColor = variantColors[variant];
  const avgSLA = data.reduce((sum, d) => sum + d.sla, 0) / data.length;
  
  // Get the last day of the month from data
  const getLastDayOfMonth = (): number => {
    if (data.length === 0) return 31;
    
    // Try to get from date field
    const firstItemWithDate = data.find(d => d.date);
    if (firstItemWithDate?.date) {
      try {
        const date = new Date(firstItemWithDate.date);
        if (!isNaN(date.getTime())) {
          const year = date.getFullYear();
          const month = date.getMonth();
          return new Date(year, month + 1, 0).getDate();
        }
      } catch {
        // Fallback
      }
    }
    
    // Fallback: use max day from data
    const maxDay = Math.max(...data.map(d => d.day));
    return maxDay > 0 ? maxDay : 31;
  };
  
  const lastDayOfMonth = getLastDayOfMonth();
  
  // Generate X axis ticks for all days in month (1, 2, 3, ... lastDayOfMonth)
  const xAxisTicks = Array.from({ length: lastDayOfMonth }, (_, i) => i + 1);
  
  // Add formatted date field to data (for tooltip)
  const formattedData = data.map(item => ({
    ...item,
    displayDate: item.date || item.day.toString()
  }));
  
  // Calculate dynamic Y axis domain
  const minSLA = Math.min(...data.map(d => d.sla));
  const minYAxis = Math.max(0, Math.floor(minSLA - 20)); // Kurangi 20, bulatkan ke bawah, minimum 0
  const maxYAxis = 100;
  
  // Generate ticks dynamically
  const generateTicks = () => {
    const ticks: number[] = [];
    const range = maxYAxis - minYAxis;
    
    if (range <= 30) {
      // Jika range kecil, gunakan interval 5
      for (let i = minYAxis; i <= maxYAxis; i += 5) {
        ticks.push(i);
      }
    } else if (range <= 50) {
      // Jika range sedang, gunakan interval 10
      for (let i = minYAxis; i <= maxYAxis; i += 10) {
        ticks.push(i);
      }
      // Pastikan 95.5 ada jika dalam range
      if (95.5 >= minYAxis && 95.5 <= maxYAxis && !ticks.includes(95.5)) {
        ticks.push(95.5);
      }
    } else {
      // Jika range besar, gunakan interval 20
      for (let i = minYAxis; i <= maxYAxis; i += 20) {
        ticks.push(i);
      }
      // Pastikan 95.5 ada jika dalam range
      if (95.5 >= minYAxis && 95.5 <= maxYAxis && !ticks.includes(95.5)) {
        ticks.push(95.5);
      }
    }
    
    // Pastikan 100 selalu ada
    if (!ticks.includes(100)) {
      ticks.push(100);
    }
    
    return ticks.sort((a, b) => a - b);
  };
  
  const yAxisTicks = generateTicks();
  
  return (
    <div className="bg-card rounded-lg p-6 card-shadow animate-slide-up">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-lg font-semibold text-foreground">{title}</h3>
          <p className="text-sm text-muted-foreground">Daily SLA - Bulan Berjalan</p>
        </div>
        <div className="text-right">
          <p className="text-2xl font-bold text-foreground">{avgSLA.toFixed(1)}%</p>
          <p className="text-xs text-muted-foreground">Rata-rata</p>
        </div>
      </div>
      
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={formattedData} margin={{ top: 20, right: 10, left: -10, bottom: 0 }}>
            <CartesianGrid 
              strokeDasharray="3 3" 
              stroke="hsl(var(--chart-grid))" 
              vertical={false}
            />
            <XAxis 
              dataKey="day" 
              type="number"
              domain={[1, lastDayOfMonth]}
              tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))', fontWeight: 500 }}
              tickLine={false}
              axisLine={{ stroke: 'hsl(var(--border))' }}
              ticks={xAxisTicks}
              allowDecimals={false}
            />
            <YAxis 
              domain={[minYAxis, maxYAxis]}
              tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))', fontWeight: 500 }}
              tickLine={false}
              axisLine={false}
              tickFormatter={(value) => `${value}%`}
              ticks={yAxisTicks}
            />
            <Tooltip 
              contentStyle={{ 
                backgroundColor: 'hsl(var(--card))',
                border: '1px solid hsl(var(--border))',
                borderRadius: '8px',
                boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                fontSize: '12px'
              }}
              labelFormatter={(value) => {
                const item = formattedData.find(d => d.day === value);
                if (item?.date) {
                  const date = new Date(item.date);
                  return date.toLocaleDateString('id-ID', { 
                    day: 'numeric', 
                    month: 'long', 
                    year: 'numeric' 
                  });
                }
                return `Tanggal ${value}`;
              }}
              formatter={(value: number) => [`${value.toFixed(1)}%`, 'SLA']}
            />
            <ReferenceLine 
              y={95.5} 
              stroke="hsl(var(--status-warning))" 
              strokeDasharray="5 5"
              label={{ 
                value: 'Target 95.5%', 
                position: 'right',
                fill: 'hsl(var(--status-warning))',
                fontSize: 10
              }}
            />
            <Line 
              type="monotone" 
              dataKey="sla" 
              stroke={lineColor}
              strokeWidth={2}
              dot={{ r: 2, fill: lineColor }}
              activeDot={{ r: 6, strokeWidth: 2, fill: 'hsl(var(--card))' }}
            >
              <LabelList 
                dataKey="sla" 
                content={CustomLabel}
              />
            </Line>
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default DailySLAChart;
