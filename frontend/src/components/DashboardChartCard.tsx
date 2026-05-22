import { motion } from 'framer-motion';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts';
import Card from './Card';

interface ChartDataPoint {
  name: string;
  value: number;
  [key: string]: any;
}

interface DashboardChartCardProps {
  title: string;
  data: ChartDataPoint[];
  isLoading?: boolean;
  dataKey?: string;
  color?: string;
}

export default function DashboardChartCard({
  title,
  data,
  isLoading,
  dataKey = 'value',
  color = '#3b82f6',
}: DashboardChartCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3 }}
    >
      <Card className="p-6">
        <h3 className="text-lg font-bold text-gray-900 mb-6">{title}</h3>

        {isLoading ? (
          <div className="w-full h-64 bg-gray-100 rounded animate-pulse" />
        ) : data.length === 0 ? (
          <div className="w-full h-64 flex items-center justify-center bg-gray-50 rounded">
            <p className="text-gray-600">No data available</p>
          </div>
        ) : (
          <div className="w-full h-64 -mx-2">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={data}
                margin={{ top: 5, right: 10, left: 0, bottom: 5 }}
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                  vertical={false}
                  stroke="#e5e7eb"
                />
                <XAxis
                  dataKey="name"
                  stroke="#9ca3af"
                  style={{ fontSize: '12px' }}
                />
                <YAxis
                  stroke="#9ca3af"
                  style={{ fontSize: '12px' }}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#fff',
                    border: '1px solid #e5e7eb',
                    borderRadius: '6px',
                  }}
                  labelStyle={{ color: '#1f2937' }}
                />
                <Line
                  type="monotone"
                  dataKey={dataKey}
                  stroke={color}
                  dot={false}
                  strokeWidth={2}
                  isAnimationActive={true}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
      </Card>
    </motion.div>
  );
}
