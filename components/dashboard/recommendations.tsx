'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Lightbulb, DollarSign, Building, Sparkles } from 'lucide-react'
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
      return 'border-red-100 bg-red-50 text-red-700 font-bold'
    case 'high':
      return 'border-orange-100 bg-orange-50 text-orange-700 font-bold'
    case 'medium':
      return 'border-amber-100 bg-amber-50 text-amber-700 font-bold'
    default:
      return 'border-blue-100 bg-blue-50 text-blue-700 font-bold'
  }
}

export function Recommendations({ analysis, isLoading }: RecommendationsProps) {
  if (!analysis && !isLoading) {
    return (
      <Card className="border-dashed border-2 flex items-center justify-center p-12 bg-muted/5">
        <div className="text-center space-y-2">
          <Sparkles className="h-8 w-8 text-primary mx-auto animate-pulse" />
          <p className="text-muted-foreground font-medium">Нажмите кнопку &quot;Обновить данные&quot;, чтобы увидеть рекомендации ИИ</p>
        </div>
      </Card>
    )
  }

  const recommendations = analysis?.recommendations || []

  return (
    <Card className="border-border bg-card shadow-sm">
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-2 text-sm font-medium text-muted-foreground uppercase tracking-wider">
          <Lightbulb className="h-4 w-4 text-amber-500" />
          Рекомендации ИИ по безопасности
        </CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-32 animate-pulse rounded-lg bg-muted/20" />
            ))}
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2">
            {recommendations.map((rec, index) => (
              <div
                key={index}
                className="group relative flex flex-col rounded-xl border border-border bg-background p-5 transition-all hover:border-primary/20 hover:shadow-md"
              >
                <div className="mb-4 flex items-start justify-between gap-4">
                  <div className="space-y-2">
                    <Badge variant="outline" className={`text-[10px] tracking-widest ${getPriorityColor(rec.priority)}`}>
                      {rec.priority === 'critical' ? 'КРИТИЧЕСКИ' : rec.priority === 'high' ? 'ВЫСОКИЙ' : 'СРЕДНИЙ'}
                    </Badge>
                    <h3 className="font-bold text-foreground leading-tight">{rec.title}</h3>
                    <p className="text-sm text-muted-foreground line-clamp-2">{rec.description}</p>
                  </div>
                </div>

                <div className="mt-auto pt-4 border-t border-border grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <div className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Экономия</div>
                    <div className="flex items-center gap-1.5 font-bold text-emerald-600">
                      <DollarSign className="h-3.5 w-3.5" />
                      <span>{formatCurrency(rec.estimatedCostSavingsTenge)}</span>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <div className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Эффект</div>
                    <div className="text-xs font-medium text-foreground truncate">
                      {rec.expectedImpact}
                    </div>
                  </div>
                </div>
                
                <div className="mt-4 flex flex-wrap gap-1.5">
                  {rec.targetOrganizations.slice(0, 3).map((org) => (
                    <span key={org} className="rounded-md bg-muted/50 px-2 py-0.5 text-[10px] font-medium text-muted-foreground border border-border/50">
                      {org}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
