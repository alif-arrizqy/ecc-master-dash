import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine, LabelList } from 'recharts';
import { DailySLA } from '@/data/mockData';

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
          <LineChart data={data} margin={{ top: 20, right: 10, left: -10, bottom: 0 }}>
            <CartesianGrid 
              strokeDasharray="3 3" 
              stroke="hsl(var(--chart-grid))" 
              vertical={false}
            />
            <XAxis 
              dataKey="day" 
              tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))', fontWeight: 500 }}
              tickLine={false}
              axisLine={{ stroke: 'hsl(var(--border))' }}
              interval={0}
            />
            <YAxis 
              domain={[80, 105]}
              tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))', fontWeight: 500 }}
              tickLine={false}
              axisLine={false}
              tickFormatter={(value) => `${value}%`}
              ticks={[80, 90, 95.5, 100]}
            />
            <Tooltip 
              contentStyle={{ 
                backgroundColor: 'hsl(var(--card))',
                border: '1px solid hsl(var(--border))',
                borderRadius: '8px',
                boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
              }}
              labelFormatter={(value) => `Tanggal ${value}`}
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
