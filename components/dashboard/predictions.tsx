'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { TrendingUp, TrendingDown, Minus, Target, AlertTriangle, MapPin } from 'lucide-react'
import type { SafetyAnalysis } from '@/app/api/analyze/route'

interface PredictionsProps {
  analysis: SafetyAnalysis | null
  isLoading: boolean
}

function getTrendIcon(trend: string) {
  switch (trend) {
    case 'increasing':
      return <TrendingUp className="h-4 w-4 text-red-600" />
    case 'decreasing':
      return <TrendingDown className="h-4 w-4 text-emerald-600" />
    default:
      return <Minus className="h-4 w-4 text-amber-600" />
  }
}

function getTrendColor(trend: string) {
  switch (trend) {
    case 'increasing':
      return 'text-red-600'
    case 'decreasing':
      return 'text-emerald-600'
    default:
      return 'text-amber-600'
  }
}

function getTrendLabel(trend: string) {
  switch (trend) {
    case 'increasing':
      return 'Рост'
    case 'decreasing':
      return 'Снижение'
    default:
      return 'Стабильно'
  }
}

export function Predictions({ analysis, isLoading }: PredictionsProps) {
  const forecasts = analysis?.forecasts
  const riskZones = analysis?.topRiskZones || []

  const forecastPeriods = [
    { label: 'Следующие 3 месяца', data: forecasts?.threeMonths },
    { label: 'Следующие 6 месяцев', data: forecasts?.sixMonths },
    { label: 'Следующие 12 месяцев', data: forecasts?.twelveMonths },
  ]

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <Card className="border-border bg-card shadow-sm">
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-2 text-sm font-medium text-muted-foreground uppercase tracking-wider">
            <Target className="h-4 w-4 text-primary" />
            Прогнозы инцидентов
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-4">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="h-24 animate-pulse rounded-lg bg-muted/20" />
              ))}
            </div>
          ) : (
            <div className="space-y-6">
              {forecastPeriods.map((period) => (
                <div
                  key={period.label}
                  className="group relative rounded-xl border border-border bg-background p-5 transition-all hover:border-primary/20 hover:shadow-md"
                >
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <p className="text-sm font-medium text-muted-foreground">{period.label}</p>
                      <div className="flex items-baseline gap-2">
                        <span className="text-3xl font-bold tracking-tight text-foreground">
                          {period.data?.predictedIncidents || 0}
                        </span>
                        <span className="text-xs font-medium text-muted-foreground uppercase">инцидентов</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5 rounded-full bg-muted/50 px-2.5 py-1">
                      {getTrendIcon(period.data?.trend || 'stable')}
                      <span className={`text-xs font-bold uppercase tracking-wider ${getTrendColor(period.data?.trend || 'stable')}`}>
                        {getTrendLabel(period.data?.trend || 'stable')}
                      </span>
                    </div>
                  </div>
                  <div className="mt-4 flex items-center gap-4 text-xs text-muted-foreground">
                    <div className="flex items-center gap-1.5">
                      <div className="h-1.5 w-1.5 rounded-full bg-primary/40" />
                      <span>95% доверительный интервал: {period.data?.confidenceInterval?.low || 0} — {period.data?.confidenceInterval?.high || 0}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="border-border bg-card shadow-sm">
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-2 text-sm font-medium text-muted-foreground uppercase tracking-wider">
            <MapPin className="h-4 w-4 text-red-600" />
            Топ-5 зон риска
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-4">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="h-20 animate-pulse rounded-lg bg-muted/20" />
              ))}
            </div>
          ) : (
            <div className="space-y-4">
              {riskZones.map((zone, idx) => (
                <div
                  key={zone.organization}
                  className="relative rounded-xl border border-border bg-background p-4 transition-all hover:border-red-200"
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <span className="flex h-6 w-6 items-center justify-center rounded-full bg-red-50 text-xs font-bold text-red-600">
                        {idx + 1}
                      </span>
                      <h4 className="font-semibold text-foreground">{zone.organization}</h4>
                    </div>
                    <Badge variant="outline" className="bg-red-50 text-red-700 border-red-100 font-bold uppercase">
                      РИСК {zone.riskScore}%
                    </Badge>
                  </div>
                  
                  <div className="space-y-3">
                    <div className="space-y-1.5">
                      <div className="flex justify-between text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                        <span>Вероятность инцидента</span>
                        <span>{zone.predictedIncidentProbability}%</span>
                      </div>
                      <Progress value={zone.predictedIncidentProbability} className="h-1.5 bg-muted" indicatorClassName="bg-red-500" />
                    </div>
                    
                    <div className="flex flex-wrap gap-1.5">
                      {zone.primaryRiskFactors.map((factor) => (
                        <span key={factor} className="rounded-md bg-muted/50 px-2 py-0.5 text-[10px] font-medium text-muted-foreground border border-border/50">
                          {factor}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
