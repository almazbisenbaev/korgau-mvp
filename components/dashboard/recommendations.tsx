'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Lightbulb, DollarSign, Building } from 'lucide-react'
import type { SafetyAnalysis } from '@/app/api/analyze/route'

interface RecommendationsProps {
  analysis: SafetyAnalysis | null
  isLoading: boolean
}

function formatCurrency(amount: number): string {
  if (amount >= 1000000000) {
    return '₸' + (amount / 1000000000).toFixed(1) + 'B'
  }
  if (amount >= 1000000) {
    return '₸' + (amount / 1000000).toFixed(1) + 'M'
  }
  if (amount >= 1000) {
    return '₸' + (amount / 1000).toFixed(1) + 'K'
  }
  return '₸' + amount
}

function getPriorityColor(priority: string) {
  switch (priority) {
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

export function Recommendations({ analysis, isLoading }: RecommendationsProps) {
  const recommendations = analysis?.recommendations || []

  return (
    <Card className="border-border/50 bg-card/50 backdrop-blur">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg text-foreground">
          <Lightbulb className="h-5 w-5 text-yellow-400" />
          AI Safety Recommendations
        </CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-32 animate-pulse rounded-lg bg-muted" />
            ))}
          </div>
        ) : (
          <div className="space-y-4">
            {recommendations.map((rec, index) => (
              <div
                key={index}
                className="rounded-lg border border-border/50 bg-secondary/30 p-4"
              >
                <div className="mb-3 flex items-start justify-between gap-4">
                  <div>
                    <div className="mb-1 flex items-center gap-2">
                      <Badge variant="outline" className={getPriorityColor(rec.priority)}>
                        {rec.priority.toUpperCase()}
                      </Badge>
                      <h3 className="font-semibold text-foreground">{rec.title}</h3>
                    </div>
                    <p className="text-sm text-muted-foreground">{rec.description}</p>
                  </div>
                </div>

                <div className="grid gap-3 sm:grid-cols-3">
                  <div className="flex items-center gap-2">
                    <DollarSign className="h-4 w-4 text-emerald-400" />
                    <div>
                      <div className="text-xs text-muted-foreground">Est. Savings</div>
                      <div className="font-medium text-emerald-400">
                        {formatCurrency(rec.estimatedCostSavingsTenge)}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Lightbulb className="h-4 w-4 text-blue-400" />
                    <div>
                      <div className="text-xs text-muted-foreground">Expected Impact</div>
                      <div className="text-sm text-foreground">{rec.expectedImpact}</div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Building className="h-4 w-4 text-purple-400" />
                    <div>
                      <div className="text-xs text-muted-foreground">Target Orgs</div>
                      <div className="flex flex-wrap gap-1">
                        {rec.targetOrganizations.slice(0, 2).map((org, i) => (
                          <Badge key={i} variant="secondary" className="text-xs">
                            {org.split(' ')[0]}
                          </Badge>
                        ))}
                        {rec.targetOrganizations.length > 2 && (
                          <Badge variant="secondary" className="text-xs">
                            +{rec.targetOrganizations.length - 2}
                          </Badge>
                        )}
                      </div>
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
