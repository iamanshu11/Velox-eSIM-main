'use client'

import React from 'react'
import { motion } from 'framer-motion'
import { BarChart, LineChart, Line, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts'
import { TrendingUp, TrendingDown } from 'lucide-react'

interface StatCardProps {
  title: string
  value: string | number
  change: number
  icon: React.ReactNode
  trend: 'up' | 'down'
}

const StatCard: React.FC<StatCardProps> = ({ title, value, change, icon, trend }) => {
  const TrendIcon = trend === 'up' ? TrendingUp : TrendingDown;
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="relative overflow-hidden rounded-lg border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-900"
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600 dark:text-gray-400">{title}</p>
          <p className="mt-2 text-2xl font-bold text-gray-900 dark:text-white">{value}</p>
          <div className={`mt-2 flex items-center text-sm font-medium ${trend === 'up' ? 'text-green-600' : 'text-red-600'}`}>
            <TrendIcon className="w-4 h-4 mr-1" />
            <span>{Math.abs(change)}%</span>
            <span className="ml-2 text-gray-500 dark:text-gray-400">from last month</span>
          </div>
        </div>
        <div className="rounded-lg bg-neutral-100 p-3 dark:bg-neutral-900">
          {icon}
        </div>
      </div>
      <div className="absolute bottom-0 left-0 h-1 w-full bg-linear-to-r from-gray-400 to-gray-600"></div>
    </motion.div>
  )
}

interface ChartDataPoint {
  name: string
  value: number
  [key: string]: string | number
}

interface AnalyticsChartProps {
  title: string
  data: ChartDataPoint[]
  type: 'line' | 'bar' | 'pie'
  dataKey?: string
  colors?: string[]
}

const AnalyticsChart: React.FC<AnalyticsChartProps> = ({ title, data, type, dataKey = 'value', colors = ['#3b82f6', '#10b981', '#f59e0b'] }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.1 }}
      className="rounded-lg border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-900"
    >
      <h3 className="mb-6 text-lg font-semibold text-gray-900 dark:text-white">{title}</h3>
      <ResponsiveContainer width="100%" height={300}>
        {type === 'line' ? (
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis dataKey="name" stroke="#6b7280" />
            <YAxis stroke="#6b7280" />
            <Tooltip contentStyle={{ backgroundColor: '#1f2937', border: 'none', borderRadius: '8px', color: '#fff' }} />
            <Legend />
            <Line type="monotone" dataKey={dataKey} stroke={colors[0]} strokeWidth={2} dot={{ fill: colors[0], r: 5 }} />
          </LineChart>
        ) : type === 'bar' ? (
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis dataKey="name" stroke="#6b7280" />
            <YAxis stroke="#6b7280" />
            <Tooltip contentStyle={{ backgroundColor: '#1f2937', border: 'none', borderRadius: '8px', color: '#fff' }} />
            <Legend />
            <Bar dataKey={dataKey} fill={colors[0]} radius={[8, 8, 0, 0]} />
          </BarChart>
        ) : (
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={({ name, value }) => `${name}: ${value}`}
              outerRadius={80}
              fill="#8884d8"
              dataKey={dataKey}
            >
              {data.map((_, index) => (
                <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
              ))}
            </Pie>
            <Tooltip />
          </PieChart>
        )}
      </ResponsiveContainer>
    </motion.div>
  )
}

interface DataTableProps {
  title: string
  columns: Array<{
    key: string
    label: string
    render?: (value: any) => React.ReactNode
  }>
  data: Record<string, any>[]
  actionButtons?: Array<{
    label: string
    onClick: (row: Record<string, any>) => void
    variant?: 'primary' | 'secondary' | 'danger'
  }>
}

const DataTable: React.FC<DataTableProps> = ({ title, columns, data, actionButtons = [] }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.2 }}
      className="overflow-hidden rounded-lg border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-900"
    >
      <div className="border-b border-gray-200 px-6 py-4 dark:border-gray-700">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{title}</h3>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-200 bg-gray-50 dark:border-gray-700 dark:bg-gray-800">
              {columns.map((col) => (
                <th key={col.key} className="px-6 py-4 text-left text-sm font-semibold text-gray-900 dark:text-white">
                  {col.label}
                </th>
              ))}
              {actionButtons.length > 0 && <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900 dark:text-white">Actions</th>}
            </tr>
          </thead>
          <tbody>
            {data.map((row, idx) => (
              <tr
                key={row.id || idx}
                className="border-b border-gray-200 transition-colors hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-gray-800"
              >
                {columns.map((col) => (
                  <td key={col.key} className="px-6 py-4 text-sm text-gray-700 dark:text-gray-300">
                    {col.render ? col.render(row[col.key]) : row[col.key]}
                  </td>
                ))}
                {actionButtons.length > 0 && (
                  <td className="px-6 py-4 text-sm">
                    <div className="flex gap-2">
                      {actionButtons.map((btn, btnIdx) => (
                        <button
                          key={btnIdx}
                          onClick={() => btn.onClick(row)}
                          className={`rounded px-2 py-1 text-xs font-medium transition-colors ${
                            btn.variant === 'danger'
                              ? 'bg-red-100 text-red-700 hover:bg-red-200 dark:bg-red-900 dark:text-red-100'
                              : btn.variant === 'secondary'
                                ? 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-100'
                                : 'bg-neutral-100 text-gray-700 hover:bg-neutral-200 dark:bg-neutral-900 dark:text-gray-100'
                          }`}
                        >
                          {btn.label}
                        </button>
                      ))}
                    </div>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </motion.div>
  )
}

export { StatCard, AnalyticsChart, DataTable }
