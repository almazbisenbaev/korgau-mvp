'use client'

import { useState, useCallback, useMemo } from 'react'
import useSWR from 'swr'
import Link from 'next/link'
import { Shield, Sparkles, Upload } from 'lucide-react'
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

function formatDateForApi(value: Date | undefined) {
  if (!value) return undefined
  return value.toISOString().split('T')[0]
}

export default function DashboardContent() {
  const [activeTab, setActiveTab] = useState('overview')
  const [filters, setFilters] = useState({
    organization: 'all',
    incidentType: 'all',
    startDate: undefined as Date | undefined,
    endDate: undefined as Date | undefined,
  })

  const queryString = useMemo(() => {
    const params = new URLSearchParams()

    if (filters.organization !== 'all') {
      params.set('organization', filters.organization)
    }
    if (filters.incidentType !== 'all') {
      params.set('incident_type', filters.incidentType)
    }

    const startDate = formatDateForApi(filters.startDate)
    const endDate = formatDateForApi(filters.endDate)

    if (startDate) {
      params.set('startDate', startDate)
    }
    if (endDate) {
      params.set('endDate', endDate)
    }

    return params.toString()
  }, [filters])

  const dataApiKey = useMemo(() => {
    if (!queryString) return '/api/data'
    return `/api/data?${queryString}`
  }, [queryString])

  const incidentsApiKey = useMemo(() => {
    if (!queryString) return '/api/incidents'
    return `/api/incidents?${queryString}`
  }, [queryString])

  const analyzeApiKey = useMemo(() => {
    if (!queryString) return '/api/analyze'
    return `/api/analyze?${queryString}`
  }, [queryString])

  const { data: dashboardData, isLoading: isDataLoading, mutate: refreshDashboardData } = useSWR(dataApiKey, fetcher)
  const { data: incidents, isLoading: isIncidentsLoading, mutate: refreshIncidents } = useSWR(incidentsApiKey, fetcher)

  const [shouldAnalyze, setShouldAnalyze] = useState(false)
  const { data: analysis, isLoading: isAnalysisLoading, mutate: refreshAnalysis } = useSWR<SafetyAnalysis>(
    shouldAnalyze ? analyzeApiKey : null,
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
        <div className="mx-auto flex min-h-14 max-w-400 flex-col gap-3 px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:py-2 lg:px-8">
          <div className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-primary" />
            <h1 className="text-sm font-semibold tracking-tight text-foreground">Qorgau AI</h1>
          </div>

          <div className="flex w-full items-center justify-end gap-2 sm:w-auto">
            <Button asChild variant="outline" size="sm" className="h-8 gap-2">
              <Link href="/import">
                <Upload className="h-3.5 w-3.5" />
                Импорт CSV
              </Link>
            </Button>
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
      <main className="mx-auto max-w-400 px-3 py-6 sm:px-4 sm:py-8 lg:px-8">
        <div className="mb-8 flex flex-col gap-1">
          <h2 className="text-2xl font-bold tracking-tight">Обзор безопасности</h2>
          <p className="text-sm text-muted-foreground">Мониторинг и анализ показателей безопасности во всех операциях.</p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-8">
          <div className="flex flex-col gap-6 border-b border-border pb-2 sm:flex-row sm:items-center sm:justify-between">
            <TabsList className="h-auto max-w-full flex-wrap gap-0 rounded-none border-b border-border bg-transparent p-0">
              <TabsTrigger
                value="overview"
                className="relative -mb-px h-10 rounded-t-md border border-transparent bg-transparent px-4 pb-1 pt-2 font-medium text-muted-foreground shadow-none transition-all hover:bg-card/40 hover:text-foreground data-[state=active]:z-10 data-[state=active]:border-border data-[state=active]:border-b-background data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-none"
              >
                📊 Обзор
              </TabsTrigger>
              <TabsTrigger
                value="predictions"
                className="relative -mb-px h-10 rounded-t-md border border-transparent bg-transparent px-4 pb-1 pt-2 font-medium text-muted-foreground shadow-none transition-all hover:bg-card/40 hover:text-foreground data-[state=active]:z-10 data-[state=active]:border-border data-[state=active]:border-b-background data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-none"
              >
                🔮 Прогнозы
              </TabsTrigger>
              <TabsTrigger
                value="recommendations"
                className="relative -mb-px h-10 rounded-t-md border border-transparent bg-transparent px-4 pb-1 pt-2 font-medium text-muted-foreground shadow-none transition-all hover:bg-card/40 hover:text-foreground data-[state=active]:z-10 data-[state=active]:border-border data-[state=active]:border-b-background data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-none"
              >
                💡 Рекомендации ИИ
              </TabsTrigger>
              <TabsTrigger
                value="alerts"
                className="relative -mb-px h-10 rounded-t-md border border-transparent bg-transparent px-4 pb-1 pt-2 font-medium text-muted-foreground shadow-none transition-all hover:bg-card/40 hover:text-foreground data-[state=active]:z-10 data-[state=active]:border-border data-[state=active]:border-b-background data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-none"
              >
                🔔 Уведомления
              </TabsTrigger>
            </TabsList>

            <div className="w-full sm:w-auto">
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
        <div className="mx-auto flex min-h-14 max-w-400 flex-col gap-2 px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:py-2 lg:px-8">
          <div className="flex flex-col gap-1">
            <p className="text-sm text-muted-foreground">
              Powered by AI Analytics
            </p>
            <p className="text-xs text-muted-foreground/50">
              © {new Date().getFullYear()} Qorgau AI Platform. All rights reserved.
            </p>
            <p className="text-xs text-muted-foreground/70">
              Поддержка: support@qorgau.ai | +7 (700) 000-00-00
            </p>
          </div>
          <p className="text-sm text-muted-foreground sm:text-right">
            Last updated: {new Date().toLocaleString()}
          </p>
        </div>
      </footer>
    </div>
  )
}
