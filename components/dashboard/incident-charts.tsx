'use client'

import { useMemo, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
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

interface Incident {
  id: number;
  date: string;
  organization: string;
  incident_type: string;
  description: string;
  severity: string;
  location: string;
  injuries: number;
  fatalities: number;
  economic_loss: string;
  created_at: Date;
}

interface IncidentChartsProps {
  incidents: Incident[]
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

export function IncidentCharts({ incidents, analysis, incidentStats, isLoading }: IncidentChartsProps) {
  const [trendVariant, setTrendVariant] = useState<'area' | 'line' | 'bar'>('area')
  const [showActual, setShowActual] = useState(true)
  const [showPredicted, setShowPredicted] = useState(true)
  const [showAverage, setShowAverage] = useState(false)

  const typeData = incidents.reduce((acc, incident) => {
    const type = incident.incident_type;
    const existing = acc.find((item) => item.name === type);
    if (existing) {
      existing.value++;
    } else {
      acc.push({ name: type, value: 1 });
    }
    return acc;
  }, [] as { name: string; value: number }[]);

  const orgData = useMemo(() => {
    if (incidentStats?.incidentsByOrg?.length) {
      return [...incidentStats.incidentsByOrg]
        .sort((a, b) => b.count - a.count)
        .slice(0, 6)
        .map((item) => ({
          name: item.organization,
          fullName: item.organization,
          incidents: item.count,
        }))
    }

    const byOrg = incidents.reduce((acc, incident) => {
      const org = incident.organization.trim().replace(/\s+/g, ' ')
      const existing = acc.find((item) => item.name === org)
      if (existing) {
        existing.incidents += 1
      } else {
        acc.push({
          name: org,
          fullName: org,
          incidents: 1,
        })
      }
      return acc
    }, [] as { name: string; fullName: string; incidents: number }[])

    return byOrg.sort((a, b) => b.incidents - a.incidents).slice(0, 6)
  }, [incidentStats?.incidentsByOrg, incidents])

  const monthlyData = incidents.reduce((acc, incident) => {
    const month = incident.date.substring(0, 7);
    const existing = acc.find((item) => item.month === month);
    if (existing) {
      existing.actual++;
    } else {
      acc.push({ month, actual: 1 });
    }
    return acc;
  }, [] as { month: string; actual: number }[]);

  const sortedMonthlyData = useMemo(() => {
    return [...monthlyData].sort((a, b) => a.month.localeCompare(b.month))
  }, [monthlyData])

  const severityData = incidents.reduce((acc, incident) => {
    const severity = SEVERITY_LABELS[incident.severity] || incident.severity;
    const existing = acc.find((item) => item.name === severity);
    if (existing) {
      existing.value++;
    } else {
      acc.push({ name: severity, value: 1, color: SEVERITY_COLORS[incident.severity] || '#2563eb' });
    }
    return acc;
  }, [] as { name: string; value: number; color: string }[]);

  const trendData = useMemo(() => {
    const baseData = (analysis?.trendAnalysis?.incidentTrendByMonth?.length
      ? analysis.trendAnalysis.incidentTrendByMonth
      : sortedMonthlyData.map((item) => ({ month: item.month, actual: item.actual, predicted: null })))
      .slice()
      .sort((a, b) => a.month.localeCompare(b.month))

    return baseData.map((point, index, list) => {
      const from = Math.max(0, index - 2)
      const window = list.slice(from, index + 1)
      const avg = window.length > 0 ? window.reduce((sum, item) => sum + (item.actual || 0), 0) / window.length : 0

      return {
        ...point,
        average: Number(avg.toFixed(2)),
      }
    })
  }, [analysis?.trendAnalysis?.incidentTrendByMonth, sortedMonthlyData])

  const hasActual = trendData.some((point) => point.actual !== null && point.actual !== undefined)
  const hasPredicted = trendData.some((point) => point.predicted !== null && point.predicted !== undefined)
  const hasAverage = trendData.some((point) => point.average !== null && point.average !== undefined)

  return (
    <div className="grid gap-6 md:grid-cols-2">
      <Card className="border-border bg-card shadow-sm">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Инциденты по типам</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex h-75 items-center justify-center">
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
            <div className="flex h-75 flex-col gap-2 items-center justify-center">
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
                  width={170}
                  tickFormatter={(value) => (value.length > 22 ? `${value.slice(0, 22)}...` : value)}
                />
                <Tooltip
                  cursor={{ fill: '#f8fafc' }}
                  contentStyle={{ backgroundColor: '#fff', border: '1px solid #e2e8f0', borderRadius: '8px' }}
                  formatter={(value: number) => [`${value}`, 'Инциденты']}
                  labelFormatter={(label) => `${label}`}
                />
                <Bar dataKey="incidents" fill="#2563eb" radius={[0, 4, 4, 0]} barSize={20} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>

      <Card className="border-border bg-card shadow-sm md:col-span-2">
        <CardHeader className="pb-2">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Тренд инцидентов и ИИ прогноз</CardTitle>
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-end">
              <div className="flex flex-wrap items-center gap-3 rounded-lg border border-border/70 px-3 py-2">
                <div className="flex items-center gap-2">
                  <Checkbox
                    id="trend-actual"
                    checked={showActual}
                    onCheckedChange={(checked) => {
                      const next = checked === true
                      if (!next && !showPredicted && !showAverage) return
                      setShowActual(next)
                    }}
                    disabled={!hasActual}
                  />
                  <Label htmlFor="trend-actual" className="text-xs text-muted-foreground">Факт</Label>
                </div>

                <div className="flex items-center gap-2">
                  <Checkbox
                    id="trend-predicted"
                    checked={showPredicted}
                    onCheckedChange={(checked) => {
                      const next = checked === true
                      if (!next && !showActual && !showAverage) return
                      setShowPredicted(next)
                    }}
                    disabled={!hasPredicted}
                  />
                  <Label htmlFor="trend-predicted" className="text-xs text-muted-foreground">ИИ прогноз</Label>
                </div>

                <div className="flex items-center gap-2">
                  <Checkbox
                    id="trend-average"
                    checked={showAverage}
                    onCheckedChange={(checked) => {
                      const next = checked === true
                      if (!next && !showActual && !showPredicted) return
                      setShowAverage(next)
                    }}
                    disabled={!hasAverage}
                  />
                  <Label htmlFor="trend-average" className="text-xs text-muted-foreground">Скользящее среднее</Label>
                </div>
              </div>

              <Select value={trendVariant} onValueChange={(value: 'area' | 'line' | 'bar') => setTrendVariant(value)}>
                <SelectTrigger className="h-8 w-full text-xs sm:w-42.5">
                  <SelectValue placeholder="Вариант графика" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="area" className="text-xs">Области</SelectItem>
                  <SelectItem value="line" className="text-xs">Линии</SelectItem>
                  <SelectItem value="bar" className="text-xs">Столбцы</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex h-87.5 items-center justify-center">
              <div className="h-full w-full animate-pulse rounded bg-muted/20" />
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={350}>
              {trendVariant === 'line' ? (
                <LineChart data={trendData}>
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
                  {showActual && hasActual && (
                    <Line type="monotone" dataKey="actual" stroke="#2563eb" strokeWidth={2} dot={{ r: 2 }} name="Фактические инциденты" />
                  )}
                  {showPredicted && hasPredicted && (
                    <Line type="monotone" dataKey="predicted" stroke="#6366f1" strokeWidth={2} strokeDasharray="5 5" dot={{ r: 2 }} name="ИИ Прогноз" />
                  )}
                  {showAverage && hasAverage && (
                    <Line type="monotone" dataKey="average" stroke="#f59e0b" strokeWidth={2} dot={false} name="Скользящее среднее" />
                  )}
                </LineChart>
              ) : trendVariant === 'bar' ? (
                <BarChart data={trendData}>
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
                  {showActual && hasActual && (
                    <Bar dataKey="actual" fill="#2563eb" radius={[4, 4, 0, 0]} name="Фактические инциденты" />
                  )}
                  {showPredicted && hasPredicted && (
                    <Bar dataKey="predicted" fill="#6366f1" radius={[4, 4, 0, 0]} name="ИИ Прогноз" />
                  )}
                  {showAverage && hasAverage && (
                    <Bar dataKey="average" fill="#f59e0b" radius={[4, 4, 0, 0]} name="Скользящее среднее" />
                  )}
                </BarChart>
              ) : (
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
                    <linearGradient id="colorAverage" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#f59e0b" stopOpacity="0.1" />
                      <stop offset="95%" stopColor="#f59e0b" stopOpacity="0" />
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
                  {showActual && hasActual && (
                    <Area
                      type="monotone"
                      dataKey="actual"
                      stroke="#2563eb"
                      strokeWidth={2}
                      fillOpacity={1}
                      fill="url(#colorActual)"
                      name="Фактические инциденты"
                    />
                  )}
                  {showPredicted && hasPredicted && (
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
                  )}
                  {showAverage && hasAverage && (
                    <Area
                      type="monotone"
                      dataKey="average"
                      stroke="#f59e0b"
                      strokeWidth={2}
                      fillOpacity={1}
                      fill="url(#colorAverage)"
                      name="Скользящее среднее"
                    />
                  )}
                </AreaChart>
              )}
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
            <div className="flex h-75 items-center justify-center">
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
