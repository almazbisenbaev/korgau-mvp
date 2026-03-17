'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { 
  AlertTriangle, 
  Users, 
  DollarSign, 
  Heart, 
  TrendingDown, 
  Shield, 
  Clock, 
  FileText 
} from 'lucide-react'
import type { SafetyAnalysis } from '@/app/api/analyze/route'

interface KPICardsProps {
  analysis: SafetyAnalysis | null
  isLoading: boolean
}

function formatNumber(num: number): string {
  if (num >= 1000000000) {
    return (num / 1000000000).toFixed(1) + 'B'
  }
  if (num >= 1000000) {
    return (num / 1000000).toFixed(1) + 'M'
  }
  if (num >= 1000) {
    return (num / 1000).toFixed(1) + 'K'
  }
  return num.toString()
}

function formatCurrency(amount: number): string {
  if (amount >= 1000000000) {
    return '₸' + (amount / 1000000000).toFixed(1) + 'B'
  }
  if (amount >= 1000000) {
    return '₸' + (amount / 1000000).toFixed(1) + 'M'
  }
  return '₸' + formatNumber(amount)
}

export function KPICards({ analysis, isLoading }: KPICardsProps) {
  const kpis = [
    {
      title: 'Total Incidents',
      value: analysis?.summary?.totalIncidents || 0,
      icon: AlertTriangle,
      color: 'text-orange-400',
      bgColor: 'bg-orange-400/10',
      format: formatNumber,
    },
    {
      title: 'Total Injuries',
      value: analysis?.summary?.totalInjuries || 0,
      icon: Users,
      color: 'text-red-400',
      bgColor: 'bg-red-400/10',
      format: formatNumber,
    },
    {
      title: 'Work Days Lost',
      value: analysis?.summary?.totalWorkDaysLost || 0,
      icon: Clock,
      color: 'text-yellow-400',
      bgColor: 'bg-yellow-400/10',
      format: formatNumber,
    },
    {
      title: 'Safety Score',
      value: analysis?.summary?.safetyScore || 0,
      icon: Shield,
      color: 'text-blue-400',
      bgColor: 'bg-blue-400/10',
      format: (v: number) => v + '%',
      suffix: '',
    },
  ]

  const economicKpis = [
    {
      title: 'Lives Saved',
      value: analysis?.summary?.livesSaved || 0,
      icon: Heart,
      color: 'text-emerald-400',
      bgColor: 'bg-emerald-400/10',
      format: formatNumber,
      description: 'Through safety interventions',
    },
    {
      title: 'Money Saved',
      value: analysis?.summary?.moneySavedTenge || 0,
      icon: DollarSign,
      color: 'text-emerald-400',
      bgColor: 'bg-emerald-400/10',
      format: formatCurrency,
      description: 'From prevented incidents',
    },
    {
      title: 'Total Cost',
      value: analysis?.summary?.totalCostTenge || 0,
      icon: TrendingDown,
      color: 'text-red-400',
      bgColor: 'bg-red-400/10',
      format: formatCurrency,
      description: 'From recorded incidents',
    },
    {
      title: 'Fatalities',
      value: analysis?.summary?.totalFatalities || 0,
      icon: FileText,
      color: analysis?.summary?.totalFatalities ? 'text-red-500' : 'text-emerald-400',
      bgColor: analysis?.summary?.totalFatalities ? 'bg-red-500/10' : 'bg-emerald-400/10',
      format: formatNumber,
      description: 'Total recorded fatalities',
    },
  ]

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        {kpis.map((kpi) => (
          <Card key={kpi.title} className="border-border/50 bg-card/50 backdrop-blur">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {kpi.title}
              </CardTitle>
              <div className={`rounded-lg p-2 ${kpi.bgColor}`}>
                <kpi.icon className={`h-4 w-4 ${kpi.color}`} />
              </div>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="h-8 w-24 animate-pulse rounded bg-muted" />
              ) : (
                <div className="text-2xl font-bold text-foreground">
                  {kpi.format(kpi.value)}
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="border-border/50 bg-card/50 backdrop-blur">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Heart className="h-5 w-5 text-emerald-400" />
            Economic Effect
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
            {economicKpis.map((kpi) => (
              <div key={kpi.title} className="space-y-1">
                <div className="flex items-center gap-2">
                  <div className={`rounded-lg p-1.5 ${kpi.bgColor}`}>
                    <kpi.icon className={`h-3.5 w-3.5 ${kpi.color}`} />
                  </div>
                  <span className="text-sm text-muted-foreground">{kpi.title}</span>
                </div>
                {isLoading ? (
                  <div className="h-7 w-20 animate-pulse rounded bg-muted" />
                ) : (
                  <>
                    <div className={`text-xl font-bold ${kpi.color}`}>
                      {kpi.format(kpi.value)}
                    </div>
                    {kpi.description && (
                      <p className="text-xs text-muted-foreground">{kpi.description}</p>
                    )}
                  </>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
