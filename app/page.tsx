'use client'

import dynamic from 'next/dynamic'

const DashboardContent = dynamic(
  () => import('@/components/dashboard/dashboard-content'),
  { 
    ssr: false,
    loading: () => (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          <p className="text-sm text-muted-foreground animate-pulse">Loading dashboard...</p>
        </div>
      </div>
    )
  }
)

export default function DashboardPage() {
  return <DashboardContent />
}
