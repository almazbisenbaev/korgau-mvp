'use client'

import { useState, useEffect, useCallback } from 'react'
import useSWR from 'swr'
import { Shield, Sparkles } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { KPICards } from '@/components/dashboard/kpi-cards'
import { IncidentCharts } from '@/components/dashboard/incident-charts'
import { Predictions } from '@/components/dashboard/predictions'
import { Recommendations } from '@/components/dashboard/recommendations'
import { KorgauAlerts } from '@/components/dashboard/korgau-alerts'
import { Filters } from '@/components/dashboard/filters'
import type { SafetyAnalysis } from '@/app/api/analyze/route'

const fetcher = (url: string) => fetch(url).then((res) => res.json())

export default function Dashboard() {
  const [activeTab, setActiveTab] = useState('overview')
  const [filters, setFilters] = useState({
    organization: 'all',
    incidentType: 'all',
    startDate: undefined as Date | undefined,
    endDate: undefined as Date | undefined,
  })

  const { data: dashboardData, isLoading: isDataLoading } = useSWR('/api/data', fetcher)
  const { data: analysis, isLoading: isAnalysisLoading, mutate: refreshAnalysis } = useSWR<SafetyAnalysis>(
    '/api/analyze',
    fetcher,
    { revalidateOnFocus: false }
  )

  const handleFilterChange = useCallback((key: string, value: string | Date | undefined) => {
    setFilters((prev) => ({ ...prev, [key]: value }))
  }, [])

  const handleRefresh = useCallback(() => {
    refreshAnalysis()
  }, [refreshAnalysis])

  const isLoading = isDataLoading || isAnalysisLoading

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-border/50 bg-background/80 backdrop-blur-lg">
        <div className="mx-auto flex h-16 max-w-[1600px] items-center justify-between px-4 lg:px-8">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
              <Shield className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h1 className="text-lg font-semibold text-foreground">Safety AI Dashboard</h1>
              <p className="text-xs text-muted-foreground">HSE Analytics Platform</p>
            </div>
          </div>
          
          <Button
            onClick={handleRefresh}
            disabled={isLoading}
            className="gap-2"
          >
            <Sparkles className="h-4 w-4" />
            {isLoading ? 'Analyzing...' : 'Run AI Analysis'}
          </Button>
        </div>
      </header>

      {/* Main Content */}
      <main className="mx-auto max-w-[1600px] px-4 py-6 lg:px-8">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <TabsList className="grid w-full grid-cols-4 sm:w-auto">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="predictions">Predictions</TabsTrigger>
              <TabsTrigger value="recommendations">AI Insights</TabsTrigger>
              <TabsTrigger value="alerts">Korgau Alerts</TabsTrigger>
            </TabsList>
            
            <Filters
              filters={filters}
              onFilterChange={handleFilterChange}
              onRefresh={handleRefresh}
              organizations={dashboardData?.filterOptions?.organizations || []}
              incidentTypes={dashboardData?.filterOptions?.incidentTypes || []}
              isLoading={isLoading}
            />
          </div>

          <TabsContent value="overview" className="space-y-6">
            <KPICards analysis={analysis || null} isLoading={isLoading} />
            <IncidentCharts
              analysis={analysis || null}
              incidentStats={dashboardData?.incidentStats || null}
              isLoading={isLoading}
            />
          </TabsContent>

          <TabsContent value="predictions" className="space-y-6">
            <KPICards analysis={analysis || null} isLoading={isLoading} />
            <Predictions analysis={analysis || null} isLoading={isLoading} />
          </TabsContent>

          <TabsContent value="recommendations" className="space-y-6">
            <Recommendations analysis={analysis || null} isLoading={isLoading} />
            <div className="grid gap-4 lg:grid-cols-2">
              <Predictions analysis={analysis || null} isLoading={isLoading} />
            </div>
          </TabsContent>

          <TabsContent value="alerts" className="space-y-6">
            <KorgauAlerts analysis={analysis || null} isLoading={isLoading} />
          </TabsContent>
        </Tabs>
      </main>

      {/* Footer */}
      <footer className="border-t border-border/50 bg-card/30">
        <div className="mx-auto flex h-14 max-w-[1600px] items-center justify-between px-4 lg:px-8">
          <p className="text-sm text-muted-foreground">
            Powered by AI Analytics
          </p>
          <p className="text-sm text-muted-foreground">
            Last updated: {new Date().toLocaleString()}
          </p>
        </div>
      </footer>
    </div>
  )
}
