'use client'

import { useState, useCallback } from 'react'
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

export default function DashboardContent() {
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
      <header className="sticky top-0 z-50 border-b border-border bg-background/95 backdrop-blur-sm">
        <div className="mx-auto flex h-14 max-w-[1600px] items-center justify-between px-4 lg:px-8">
          <div className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-primary" />
            <h1 className="text-sm font-semibold tracking-tight text-foreground">Korgau AI</h1>
          </div>
          
          <Button
            onClick={handleRefresh}
            disabled={isLoading}
            variant="outline"
            size="sm"
            className="gap-2 h-8"
          >
            <Sparkles className="h-3.5 w-3.5" />
            {isLoading ? 'Analyzing...' : 'Refresh Insights'}
          </Button>
        </div>
      </header>

      {/* Main Content */}
      <main className="mx-auto max-w-[1600px] px-4 py-8 lg:px-8">
        <div className="mb-8 flex flex-col gap-1">
          <h2 className="text-2xl font-bold tracking-tight">Safety Overview</h2>
          <p className="text-sm text-muted-foreground">Monitor and analyze safety performance across all operations.</p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-8">
          <div className="flex flex-col gap-6 border-b border-border pb-2 sm:flex-row sm:items-center sm:justify-between">
            <TabsList className="h-9 bg-transparent p-0 gap-6">
              <TabsTrigger 
                value="overview" 
                className="relative h-9 rounded-none border-b-2 border-transparent bg-transparent px-1 pb-3 pt-2 font-medium text-muted-foreground shadow-none transition-none data-[state=active]:border-primary data-[state=active]:text-foreground data-[state=active]:shadow-none"
              >
                Overview
              </TabsTrigger>
              <TabsTrigger 
                value="predictions"
                className="relative h-9 rounded-none border-b-2 border-transparent bg-transparent px-1 pb-3 pt-2 font-medium text-muted-foreground shadow-none transition-none data-[state=active]:border-primary data-[state=active]:text-foreground data-[state=active]:shadow-none"
              >
                Predictions
              </TabsTrigger>
              <TabsTrigger 
                value="recommendations"
                className="relative h-9 rounded-none border-b-2 border-transparent bg-transparent px-1 pb-3 pt-2 font-medium text-muted-foreground shadow-none transition-none data-[state=active]:border-primary data-[state=active]:text-foreground data-[state=active]:shadow-none"
              >
                AI Insights
              </TabsTrigger>
              <TabsTrigger 
                value="alerts"
                className="relative h-9 rounded-none border-b-2 border-transparent bg-transparent px-1 pb-3 pt-2 font-medium text-muted-foreground shadow-none transition-none data-[state=active]:border-primary data-[state=active]:text-foreground data-[state=active]:shadow-none"
              >
                Safety Alerts
              </TabsTrigger>
            </TabsList>
            
            <div className="flex items-center gap-2">
              <Filters
                filters={filters}
                onFilterChange={handleFilterChange}
                onRefresh={handleRefresh}
                organizations={dashboardData?.filterOptions?.organizations || []}
                incidentTypes={dashboardData?.filterOptions?.incidentTypes || []}
                isLoading={isLoading}
              />
            </div>
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
          <div className="flex flex-col gap-1">
            <p className="text-sm text-muted-foreground">
              Powered by AI Analytics
            </p>
            <p className="text-xs text-muted-foreground/50">
              © {new Date().getFullYear()} Safety AI Platform
            </p>
          </div>
          <p className="text-sm text-muted-foreground">
            Last updated: {new Date().toLocaleString()}
          </p>
        </div>
      </footer>
    </div>
  )
}
