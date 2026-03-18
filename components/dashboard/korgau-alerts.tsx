'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { AlertTriangle, TrendingUp, Zap, Building, Hash, Sparkles } from 'lucide-react'
import type { SafetyAnalysis } from '@/app/api/analyze/route'

interface KorgauAlertsProps {
  analysis: SafetyAnalysis | null
  isLoading: boolean
}

function getAlertTypeIcon(type: string) {
  switch (type) {
    case 'systematic_violation':
      return <AlertTriangle className="h-4 w-4" />
    case 'emerging_trend':
      return <TrendingUp className="h-4 w-4" />
    case 'critical_risk':
      return <Zap className="h-4 w-4" />
    default:
      return <AlertTriangle className="h-4 w-4" />
  }
}

function getAlertTypeLabel(type: string) {
  switch (type) {
    case 'systematic_violation':
      return 'Систематическое нарушение'
    case 'emerging_trend':
      return 'Новый тренд'
    case 'critical_risk':
      return 'Критический риск'
    default:
      return type
  }
}

function getSeverityLabel(severity: string) {
  switch (severity) {
    case 'critical':
      return 'КРИТИЧЕСКИ'
    case 'high':
      return 'ВЫСОКИЙ'
    case 'medium':
      return 'СРЕДНИЙ'
    default:
      return severity.toUpperCase()
  }
}

function getSeverityColor(severity: string) {
  switch (severity) {
    case 'critical':
      return 'border-red-100 bg-red-50 text-red-700 font-bold'
    case 'high':
      return 'border-orange-100 bg-orange-50 text-orange-700 font-bold'
    case 'medium':
      return 'border-amber-100 bg-amber-50 text-amber-700 font-bold'
    default:
      return 'border-blue-100 bg-blue-50 text-blue-700 font-bold'
  }
}

function getAlertBorderColor(severity: string) {
  switch (severity) {
    case 'critical':
      return 'border-l-red-500'
    case 'high':
      return 'border-l-orange-500'
    case 'medium':
      return 'border-l-amber-500'
    default:
      return 'border-l-blue-500'
  }
}

export function KorgauAlerts({ analysis, isLoading }: KorgauAlertsProps) {
  if (!analysis && !isLoading) {
    return (
      <Card className="border-dashed border-2 flex items-center justify-center p-12 bg-muted/5">
        <div className="text-center space-y-2">
          <Sparkles className="h-8 w-8 text-primary mx-auto animate-pulse" />
          <p className="text-muted-foreground font-medium">Нажмите кнопку &quot;Обновить данные&quot;, чтобы увидеть уведомления безопасности</p>
        </div>
      </Card>
    )
  }

  const alerts = analysis?.korgauAlerts || []

  return (
    <Card className="border-border bg-card shadow-sm">
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-2 text-sm font-medium text-muted-foreground uppercase tracking-wider">
          <AlertTriangle className="h-4 w-4 text-orange-500" />
          Уведомления безопасности
          {alerts.length > 0 && (
            <Badge variant="secondary" className="ml-2 h-5 bg-orange-100 text-orange-700 border-none font-bold">
              {alerts.length}
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-28 animate-pulse rounded-lg bg-muted/20" />
            ))}
          </div>
        ) : alerts.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="mb-4 rounded-full bg-emerald-50 p-4">
              <Zap className="h-8 w-8 text-emerald-500" />
            </div>
            <h3 className="text-lg font-bold text-foreground">Нет активных уведомлений</h3>
            <p className="max-w-[280px] text-sm text-muted-foreground">
              Все показатели безопасности находятся в пределах нормы.
            </p>
          </div>
        ) : (
          <div className="grid gap-4">
            {alerts.map((alert, index) => (
              <div
                key={index}
                className={`relative overflow-hidden rounded-xl border border-border bg-background p-5 transition-all hover:shadow-md border-l-4 ${getAlertBorderColor(alert.severity)}`}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 space-y-3">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className={`text-[10px] tracking-widest ${getSeverityColor(alert.severity)}`}>
                        {getSeverityLabel(alert.severity)}
                      </Badge>
                      <span className="text-xs font-bold text-muted-foreground uppercase tracking-tighter">
                        {getAlertTypeLabel(alert.alertType)}
                      </span>
                    </div>
                    
                    <div>
                      <h4 className="font-bold text-foreground leading-tight mb-1">{alert.category}</h4>
                      <p className="text-sm text-muted-foreground">{alert.description}</p>
                    </div>

                    <div className="pt-2 flex flex-wrap items-center gap-4 border-t border-border/50">
                      <div className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                        <Building className="h-3.5 w-3.5" />
                        <span>{alert.affectedOrganizations.join(', ')}</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                        <Hash className="h-3.5 w-3.5" />
                        <span>{alert.frequency} случаев</span>
                      </div>
                    </div>

                    <div className="mt-4 rounded-lg bg-muted/30 p-3">
                      <div className="flex items-center gap-2 text-xs font-bold text-foreground mb-1 uppercase tracking-wider">
                        <Zap className="h-3.5 w-3.5 text-primary" />
                        <span>Рекомендуемые меры</span>
                      </div>
                      <p className="text-sm text-muted-foreground italic">
                        "{alert.recommendedIntervention}"
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
