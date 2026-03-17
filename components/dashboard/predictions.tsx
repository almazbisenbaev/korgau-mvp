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
      return <TrendingUp className="h-4 w-4 text-red-400" />
    case 'decreasing':
      return <TrendingDown className="h-4 w-4 text-emerald-400" />
    default:
      return <Minus className="h-4 w-4 text-yellow-400" />
  }
}

function getTrendColor(trend: string) {
  switch (trend) {
    case 'increasing':
      return 'text-red-400'
    case 'decreasing':
      return 'text-emerald-400'
    default:
      return 'text-yellow-400'
  }
}

export function Predictions({ analysis, isLoading }: PredictionsProps) {
  const forecasts = analysis?.forecasts
  const riskZones = analysis?.topRiskZones || []

  const forecastPeriods = [
    { label: '3 Months', data: forecasts?.threeMonths },
    { label: '6 Months', data: forecasts?.sixMonths },
    { label: '12 Months', data: forecasts?.twelveMonths },
  ]

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <Card className="border-border/50 bg-card/50 backdrop-blur">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg text-foreground">
            <Target className="h-5 w-5 text-primary" />
            Incident Forecasts
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-4">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="h-24 animate-pulse rounded-lg bg-muted" />
              ))}
            </div>
          ) : (
            <div className="space-y-4">
              {forecastPeriods.map((period) => (
                <div
                  key={period.label}
                  className="rounded-lg border border-border/50 bg-secondary/30 p-4"
                >
                  <div className="mb-2 flex items-center justify-between">
                    <span className="font-medium text-foreground">{period.label}</span>
                    <div className="flex items-center gap-2">
                      {getTrendIcon(period.data?.trend || 'stable')}
                      <span className={`text-sm capitalize ${getTrendColor(period.data?.trend || 'stable')}`}>
                        {period.data?.trend || 'stable'}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-baseline gap-2">
                    <span className="text-3xl font-bold text-foreground">
                      {period.data?.predictedIncidents || 0}
                    </span>
                    <span className="text-sm text-muted-foreground">predicted incidents</span>
                  </div>
                  <div className="mt-2 text-sm text-muted-foreground">
                    95% CI: {period.data?.confidenceInterval.low || 0} - {period.data?.confidenceInterval.high || 0}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="border-border/50 bg-card/50 backdrop-blur">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg text-foreground">
            <MapPin className="h-5 w-5 text-red-400" />
            Top 5 Risk Zones
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="h-20 animate-pulse rounded-lg bg-muted" />
              ))}
            </div>
          ) : (
            <div className="space-y-3">
              {riskZones.map((zone) => (
                <div
                  key={zone.rank}
                  className="rounded-lg border border-border/50 bg-secondary/30 p-3"
                >
                  <div className="mb-2 flex items-start justify-between">
                    <div className="flex items-center gap-2">
                      <span className="flex h-6 w-6 items-center justify-center rounded-full bg-red-500/20 text-xs font-bold text-red-400">
                        {zone.rank}
                      </span>
                      <span className="font-medium text-foreground">{zone.organization}</span>
                    </div>
                    <Badge
                      variant="outline"
                      className={
                        zone.riskScore >= 70
                          ? 'border-red-500/50 bg-red-500/10 text-red-400'
                          : zone.riskScore >= 50
                          ? 'border-orange-500/50 bg-orange-500/10 text-orange-400'
                          : 'border-yellow-500/50 bg-yellow-500/10 text-yellow-400'
                      }
                    >
                      Risk: {zone.riskScore}%
                    </Badge>
                  </div>
                  <div className="mb-2">
                    <div className="mb-1 flex justify-between text-xs text-muted-foreground">
                      <span>Incident Probability (3mo)</span>
                      <span>{zone.predictedIncidentProbability}%</span>
                    </div>
                    <Progress
                      value={zone.predictedIncidentProbability}
                      className="h-1.5"
                    />
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {zone.primaryRiskFactors.slice(0, 2).map((factor, i) => (
                      <Badge
                        key={i}
                        variant="secondary"
                        className="bg-secondary/50 text-xs"
                      >
                        {factor}
                      </Badge>
                    ))}
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
