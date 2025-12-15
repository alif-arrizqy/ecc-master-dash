import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine, LabelList } from 'recharts';
import { DailySLA } from '@/data/mockData';

interface CompactDailySLAChartProps {
  data: DailySLA[];
  title: string;
  variant?: 'default' | 'talis5Full' | 'talis5Mix' | 'jsPro';
}

const variantColors = {
  default: 'hsl(217, 91%, 50%)',
  talis5Full: 'hsl(217, 91%, 50%)',
  talis5Mix: 'hsl(173, 80%, 40%)',
  jsPro: 'hsl(245, 58%, 51%)',
};

const CustomLabel = (props: { x?: number | string; y?: number | string; value?: number | string; dataLength?: number }) => {
  const { x, y, value } = props;
  
  if (x === undefined || y === undefined || value === undefined) {
    return null;
  }
  
  const numValue = typeof value === 'number' ? value : parseFloat(String(value));
  const numX = typeof x === 'number' ? x : parseFloat(String(x));
  const numY = typeof y === 'number' ? y : parseFloat(String(y));
  
  if (isNaN(numValue) || isNaN(numX) || isNaN(numY)) {
    return null;
  }
  
  return (
    <text
      x={numX}
      y={numY - 8}
      fill="hsl(var(--foreground))"
      fontSize={12}
      fontWeight={600}
      textAnchor="middle"
    >
      {numValue.toFixed(0)}
    </text>
  );
};

const CompactDailySLAChart = ({ data, title, variant = 'default' }: CompactDailySLAChartProps) => {
  const lineColor = variantColors[variant];
  
  return (
    <div className="bg-card rounded-lg p-3 card-shadow">
      <h3 className="text-sm font-semibold text-foreground mb-2">{title}</h3>
      <div className="h-36">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 15, right: 5, left: -15, bottom: 0 }}>
            <CartesianGrid 
              strokeDasharray="3 3" 
              stroke="hsl(var(--chart-grid))" 
              vertical={false}
            />
            <XAxis 
              dataKey="day" 
              tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))', fontWeight: 500 }}
              tickLine={false}
              axisLine={{ stroke: 'hsl(var(--border))' }}
              interval={0}
            />
            <YAxis 
              domain={[80, 105]}
              tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))', fontWeight: 500 }}
              tickLine={false}
              axisLine={false}
              tickFormatter={(value) => `${value}%`}
              ticks={[80, 90, 95.5, 100]}
            />
            <Tooltip 
              contentStyle={{ 
                backgroundColor: 'hsl(var(--card))',
                border: '1px solid hsl(var(--border))',
                borderRadius: '6px',
                fontSize: '11px'
              }}
              labelFormatter={(value) => `Tanggal ${value}`}
              formatter={(value: number) => [`${value.toFixed(1)}%`, 'SLA']}
              wrapperStyle={{ zIndex: 100 }}
            />
            <ReferenceLine 
              y={95.5} 
              stroke="hsl(var(--status-warning))" 
              strokeDasharray="3 3"
            />
            <Line 
              type="monotone" 
              dataKey="sla" 
              stroke={lineColor}
              strokeWidth={2}
              dot={{ r: 2, fill: lineColor }}
              activeDot={{ r: 4, strokeWidth: 1, fill: 'hsl(var(--card))' }}
            >
              <LabelList 
                dataKey="sla" 
                content={(props) => <CustomLabel {...props} dataLength={data.length} />}
              />
            </Line>
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default CompactDailySLAChart;
