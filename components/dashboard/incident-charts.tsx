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

const COLORS = ['#6366f1', '#22c55e', '#eab308', '#ef4444', '#8b5cf6']
const SEVERITY_COLORS: Record<string, string> = {
  critical: '#ef4444',
  high: '#f97316',
  medium: '#eab308',
  low: '#22c55e',
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
    name: item.severity.charAt(0).toUpperCase() + item.severity.slice(1),
    value: Number(item.count),
    color: SEVERITY_COLORS[item.severity] || '#6366f1',
  })) || []

  const trendData = analysis?.trendAnalysis?.incidentTrendByMonth || monthlyData.map(m => ({
    month: m.month,
    actual: m.actual,
    predicted: null,
  }))

  return (
    <div className="grid gap-4 md:grid-cols-2">
      <Card className="border-border/50 bg-card/50 backdrop-blur">
        <CardHeader>
          <CardTitle className="text-lg text-foreground">Incidents by Type</CardTitle>
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
                  data={typeData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={2}
                  dataKey="value"
                  label={({ name, percent }) => `${name.split('/')[0]} ${(percent * 100).toFixed(0)}%`}
                  labelLine={false}
                >
                  {typeData.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
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
              </PieChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>

      <Card className="border-border/50 bg-card/50 backdrop-blur">
        <CardHeader>
          <CardTitle className="text-lg text-foreground">Incidents by Organization</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex h-[300px] flex-col justify-center gap-2">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="h-8 animate-pulse rounded bg-muted" />
              ))}
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={orgData} layout="vertical" margin={{ left: 10, right: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis type="number" stroke="hsl(var(--muted-foreground))" />
                <YAxis 
                  type="category" 
                  dataKey="name" 
                  stroke="hsl(var(--muted-foreground))"
                  width={80}
                  tick={{ fontSize: 12 }}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px',
                    color: 'hsl(var(--foreground))',
                  }}
                  formatter={(value, _, props) => [value, props.payload.fullName]}
                />
                <Bar dataKey="incidents" fill="#6366f1" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>

      <Card className="border-border/50 bg-card/50 backdrop-blur">
        <CardHeader>
          <CardTitle className="text-lg text-foreground">Incident Trend</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex h-[300px] items-end justify-between gap-2">
              {[...Array(12)].map((_, i) => (
                <div
                  key={i}
                  className="w-full animate-pulse rounded-t bg-muted"
                  style={{ height: `${Math.random() * 200 + 50}px` }}
                />
              ))}
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={trendData} margin={{ left: 0, right: 10 }}>
                <defs>
                  <linearGradient id="colorActual" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis 
                  dataKey="month" 
                  stroke="hsl(var(--muted-foreground))"
                  tick={{ fontSize: 12 }}
                />
                <YAxis stroke="hsl(var(--muted-foreground))" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px',
                    color: 'hsl(var(--foreground))',
                  }}
                />
                <Legend />
                <Area
                  type="monotone"
                  dataKey="actual"
                  stroke="#6366f1"
                  fillOpacity={1}
                  fill="url(#colorActual)"
                  strokeWidth={2}
                  name="Actual Incidents"
                />
                {trendData.some(d => d.predicted !== null) && (
                  <Line
                    type="monotone"
                    dataKey="predicted"
                    stroke="#22c55e"
                    strokeDasharray="5 5"
                    strokeWidth={2}
                    name="Predicted"
                    dot={false}
                  />
                )}
              </AreaChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>

      <Card className="border-border/50 bg-card/50 backdrop-blur">
        <CardHeader>
          <CardTitle className="text-lg text-foreground">Incidents by Severity</CardTitle>
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
