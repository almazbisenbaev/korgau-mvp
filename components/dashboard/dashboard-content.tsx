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
import { IncidentForm } from '@/components/dashboard/incident-form'
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

  const { data: dashboardData, isLoading: isDataLoading, mutate: refreshDashboardData } = useSWR('/api/data', fetcher)
  const { data: incidents, isLoading: isIncidentsLoading, mutate: refreshIncidents } = useSWR('/api/incidents', fetcher)

  const [shouldAnalyze, setShouldAnalyze] = useState(false)
  const { data: analysis, isLoading: isAnalysisLoading, mutate: refreshAnalysis } = useSWR<SafetyAnalysis>(
    shouldAnalyze ? '/api/analyze' : null,
    fetcher,
    { revalidateOnFocus: false }
  )

  const handleFilterChange = useCallback((key: string, value: string | Date | undefined) => {
    setFilters((prev) => ({ ...prev, [key]: value }))
  }, [])

  const handleRefresh = useCallback(() => {
    setShouldAnalyze(true)
    refreshAnalysis()
    refreshDashboardData()
    refreshIncidents()
  }, [refreshAnalysis, refreshDashboardData, refreshIncidents])

  const isLoading = isDataLoading || isAnalysisLoading || isIncidentsLoading

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-border bg-background/95 backdrop-blur-sm">
        <div className="mx-auto flex h-14 max-w-[1600px] items-center justify-between px-4 lg:px-8">
          <div className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-primary" />
            <h1 className="text-sm font-semibold tracking-tight text-foreground">Korgau AI</h1>
          </div>

          <div className="flex items-center gap-2">
            <IncidentForm onIncidentAdded={() => {
              refreshIncidents()
              refreshDashboardData()
              if (shouldAnalyze) refreshAnalysis()
            }} />
            <Button
              onClick={handleRefresh}
              disabled={isLoading}
              variant="outline"
              size="sm"
              className="gap-2 h-8"
            >
              <Sparkles className="h-3.5 w-3.5" />
              {isLoading ? 'Анализ...' : 'Обновить данные'}
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="mx-auto max-w-[1600px] px-4 py-8 lg:px-8">
        <div className="mb-8 flex flex-col gap-1">
          <h2 className="text-2xl font-bold tracking-tight">Обзор безопасности</h2>
          <p className="text-sm text-muted-foreground">Мониторинг и анализ показателей безопасности во всех операциях.</p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-8">
          <div className="flex flex-col gap-6 border-b border-border pb-2 sm:flex-row sm:items-center sm:justify-between">
            <TabsList className="h-auto bg-transparent p-0 gap-2">
              <TabsTrigger
                value="overview"
                className="relative h-10 rounded-t-lg border border-border border-b-0 bg-card/50 px-4 pb-1 pt-2 font-medium text-muted-foreground shadow-none transition-all cursor-pointer hover:bg-card hover:text-foreground data-[state=active]:border-primary data-[state=active]:border-b-0 data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-none"
              >
                📊 Обзор
              </TabsTrigger>
              <TabsTrigger
                value="predictions"
                className="relative h-10 rounded-t-lg border border-border border-b-0 bg-card/50 px-4 pb-1 pt-2 font-medium text-muted-foreground shadow-none transition-all cursor-pointer hover:bg-card hover:text-foreground data-[state=active]:border-primary data-[state=active]:border-b-0 data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-none"
              >
                🔮 Прогнозы
              </TabsTrigger>
              <TabsTrigger
                value="recommendations"
                className="relative h-10 rounded-t-lg border border-border border-b-0 bg-card/50 px-4 pb-1 pt-2 font-medium text-muted-foreground shadow-none transition-all cursor-pointer hover:bg-card hover:text-foreground data-[state=active]:border-primary data-[state=active]:border-b-0 data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-none"
              >
                💡 Рекомендации ИИ
              </TabsTrigger>
              <TabsTrigger
                value="alerts"
                className="relative h-10 rounded-t-lg border border-border border-b-0 bg-card/50 px-4 pb-1 pt-2 font-medium text-muted-foreground shadow-none transition-all cursor-pointer hover:bg-card hover:text-foreground data-[state=active]:border-primary data-[state=active]:border-b-0 data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-none"
              >
                🔔 Уведомления
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
            <KPICards
              analysis={analysis || null}
              incidentStats={dashboardData?.incidentStats || null}
              isLoading={isLoading}
            />
            <IncidentCharts
              incidents={incidents || []}
              analysis={analysis || null}
              incidentStats={dashboardData?.incidentStats || null}
              isLoading={isLoading}
            />
          </TabsContent>

          <TabsContent value="predictions" className="space-y-6">
            <KPICards analysis={analysis || null} incidentStats={dashboardData?.incidentStats || null} isLoading={isLoading} />
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
