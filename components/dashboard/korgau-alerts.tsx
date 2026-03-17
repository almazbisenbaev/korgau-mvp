'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { AlertTriangle, TrendingUp, Zap, Building, Hash } from 'lucide-react'
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
      return 'Systematic Violation'
    case 'emerging_trend':
      return 'Emerging Trend'
    case 'critical_risk':
      return 'Critical Risk'
    default:
      return type
  }
}

function getSeverityColor(severity: string) {
  switch (severity) {
    case 'critical':
      return 'border-red-500/50 bg-red-500/10 text-red-400'
    case 'high':
      return 'border-orange-500/50 bg-orange-500/10 text-orange-400'
    case 'medium':
      return 'border-yellow-500/50 bg-yellow-500/10 text-yellow-400'
    default:
      return 'border-blue-500/50 bg-blue-500/10 text-blue-400'
  }
}

function getAlertBorderColor(severity: string) {
  switch (severity) {
    case 'critical':
      return 'border-l-red-500'
    case 'high':
      return 'border-l-orange-500'
    case 'medium':
      return 'border-l-yellow-500'
    default:
      return 'border-l-blue-500'
  }
}

export function KorgauAlerts({ analysis, isLoading }: KorgauAlertsProps) {
  const alerts = analysis?.korgauAlerts || []

  return (
    <Card className="border-border/50 bg-card/50 backdrop-blur">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg text-foreground">
          <AlertTriangle className="h-5 w-5 text-orange-400" />
          Korgau Safety Alerts
          {alerts.length > 0 && (
            <Badge variant="secondary" className="ml-2">
              {alerts.length} Active
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-28 animate-pulse rounded-lg bg-muted" />
            ))}
          </div>
        ) : alerts.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <div className="mb-3 rounded-full bg-emerald-500/10 p-3">
              <AlertTriangle className="h-6 w-6 text-emerald-400" />
            </div>
            <h3 className="font-medium text-foreground">No Active Alerts</h3>
            <p className="text-sm text-muted-foreground">
              All safety observations are within normal parameters
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {alerts.map((alert, index) => (
              <Alert
                key={index}
                className={`border-l-4 ${getAlertBorderColor(alert.severity)} bg-secondary/30`}
              >
                <div className="flex items-start gap-3">
                  <div className="mt-0.5">{getAlertTypeIcon(alert.alertType)}</div>
                  <div className="flex-1">
                    <div className="mb-2 flex flex-wrap items-center gap-2">
                      <AlertTitle className="text-foreground">{alert.category}</AlertTitle>
                      <Badge variant="outline" className={getSeverityColor(alert.severity)}>
                        {alert.severity.toUpperCase()}
                      </Badge>
                      <Badge variant="secondary" className="text-xs">
                        {getAlertTypeLabel(alert.alertType)}
                      </Badge>
                    </div>
                    <AlertDescription className="text-muted-foreground">
                      {alert.description}
                    </AlertDescription>

                    <div className="mt-3 grid gap-2 sm:grid-cols-2">
                      <div className="flex items-center gap-2 text-sm">
                        <Building className="h-3.5 w-3.5 text-muted-foreground" />
                        <span className="text-muted-foreground">Affected:</span>
                        <div className="flex flex-wrap gap-1">
                          {alert.affectedOrganizations.slice(0, 2).map((org, i) => (
                            <Badge key={i} variant="secondary" className="text-xs">
                              {org.split(' ')[0]}
                            </Badge>
                          ))}
                          {alert.affectedOrganizations.length > 2 && (
                            <Badge variant="secondary" className="text-xs">
                              +{alert.affectedOrganizations.length - 2}
                            </Badge>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <Hash className="h-3.5 w-3.5 text-muted-foreground" />
                        <span className="text-muted-foreground">Occurrences:</span>
                        <span className="font-medium text-foreground">{alert.frequency}</span>
                      </div>
                    </div>

                    <div className="mt-3 rounded-md bg-primary/5 p-2">
                      <div className="text-xs font-medium text-primary">
                        Recommended Intervention
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {alert.recommendedIntervention}
                      </p>
                    </div>
                  </div>
                </div>
              </Alert>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
