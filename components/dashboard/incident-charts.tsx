'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  Legend,
  Area,
  AreaChart,
} from 'recharts'
import type { SafetyAnalysis } from '@/app/api/analyze/route'

interface IncidentChartsProps {
  analysis: SafetyAnalysis | null
  incidentStats: {
    incidentsByType: { incident_type: string; count: number }[]
    incidentsByOrg: { organization: string; count: number }[]
    incidentsByMonth: { month: string; count: number }[]
    incidentsBySeverity: { severity: string; count: number }[]
  } | null
  isLoading: boolean
}

const COLORS = ['#2563eb', '#10b981', '#f59e0b', '#ef4444', '#6366f1']
const SEVERITY_COLORS: Record<string, string> = {
  critical: '#dc2626',
  high: '#ea580c',
  medium: '#d97706',
  low: '#16a34a',
}

const SEVERITY_LABELS: Record<string, string> = {
  critical: 'Критическая',
  high: 'Высокая',
  medium: 'Средняя',
  low: 'Низкая',
}

export function IncidentCharts({ analysis, incidentStats, isLoading }: IncidentChartsProps) {
  const typeData = incidentStats?.incidentsByType?.map((item) => ({
    name: item.incident_type,
    value: Number(item.count),
  })) || []

  const orgData = incidentStats?.incidentsByOrg?.slice(0, 6).map((item) => ({
    name: item.organization.split(' ')[0],
    fullName: item.organization,
    incidents: Number(item.count),
  })) || []

  const monthlyData = incidentStats?.incidentsByMonth?.map((item) => ({
    month: item.month,
    actual: Number(item.count),
  })) || []

  const severityData = incidentStats?.incidentsBySeverity?.map((item) => ({
    name: SEVERITY_LABELS[item.severity] || item.severity,
    value: Number(item.count),
    color: SEVERITY_COLORS[item.severity] || '#2563eb',
  })) || []

  const trendData = analysis?.trendAnalysis?.incidentTrendByMonth || monthlyData.map(m => ({
    month: m.month,
    actual: m.actual,
    predicted: null,
  }))

  return (
    <div className="grid gap-6 md:grid-cols-2">
      <Card className="border-border bg-card shadow-sm">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Инциденты по типам</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex h-[300px] items-center justify-center">
              <div className="h-32 w-32 animate-pulse rounded-full bg-muted/20" />
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={typeData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={4}
                  dataKey="value"
                  label={({ percent }) => `${(percent * 100).toFixed(0)}%`}
                  labelLine={false}
                >
                  {typeData.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ backgroundColor: '#fff', border: '1px solid #e2e8f0', borderRadius: '8px' }}
                />
                <Legend 
                  verticalAlign="bottom" 
                  height={36} 
                  formatter={(value) => <span className="text-xs text-muted-foreground">{value}</span>}
                />
              </PieChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>

      <Card className="border-border bg-card shadow-sm">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Топ организаций</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex h-[300px] flex-col gap-2 items-center justify-center">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="h-8 w-full animate-pulse rounded bg-muted/20" />
              ))}
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={orgData} layout="vertical" margin={{ left: 20 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#f1f5f9" />
                <XAxis type="number" hide />
                <YAxis
                  dataKey="name"
                  type="category"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 12, fill: '#64748b' }}
                />
                <Tooltip
                  cursor={{ fill: '#f8fafc' }}
                  contentStyle={{ backgroundColor: '#fff', border: '1px solid #e2e8f0', borderRadius: '8px' }}
                />
                <Bar dataKey="incidents" fill="#2563eb" radius={[0, 4, 4, 0]} barSize={20} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>

      <Card className="border-border bg-card shadow-sm md:col-span-2">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Тренд инцидентов и ИИ прогноз</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex h-[350px] items-center justify-center">
              <div className="h-full w-full animate-pulse rounded bg-muted/20" />
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={350}>
              <AreaChart data={trendData}>
                <defs>
                  <linearGradient id="colorActual" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#2563eb" stopOpacity="0.1" />
                    <stop offset="95%" stopColor="#2563eb" stopOpacity="0" />
                  </linearGradient>
                  <linearGradient id="colorPredicted" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity="0.1" />
                    <stop offset="95%" stopColor="#6366f1" stopOpacity="0" />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis
                  dataKey="month"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 12, fill: '#64748b' }}
                />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 12, fill: '#64748b' }}
                />
                <Tooltip
                  contentStyle={{ backgroundColor: '#fff', border: '1px solid #e2e8f0', borderRadius: '8px' }}
                />
                <Legend verticalAlign="top" align="right" height={36} />
                <Area
                  type="monotone"
                  dataKey="actual"
                  stroke="#2563eb"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#colorActual)"
                  name="Фактические инциденты"
                />
                <Area
                  type="monotone"
                  dataKey="predicted"
                  stroke="#6366f1"
                  strokeWidth={2}
                  strokeDasharray="5 5"
                  fillOpacity={1}
                  fill="url(#colorPredicted)"
                  name="ИИ Прогноз"
                />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>

      <Card className="border-border/50 bg-card/50 backdrop-blur">
        <CardHeader>
          <CardTitle className="text-lg text-foreground">Инциденты по степени тяжести</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex h-[300px] items-center justify-center">
              <div className="h-32 w-32 animate-pulse rounded-full bg-muted" />
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={severityData}
                  cx="50%"
                  cy="50%"
                  outerRadius={100}
                  dataKey="value"
                  label={({ name, value }) => `${name}: ${value}`}
                >
                  {severityData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px',
                    color: 'hsl(var(--foreground))',
                  }}
                />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
