import { getIncidents, getKorgauCards, getIncidentStats, getKorgauStats, getFilterOptions } from '@/lib/db'
import { NextRequest } from 'next/server'

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const type = searchParams.get('type')
  
  try {
    if (type === 'incidents') {
      const filters = {
        organization: searchParams.get('organization') || undefined,
        incident_type: searchParams.get('incident_type') || undefined,
        startDate: searchParams.get('startDate') || undefined,
        endDate: searchParams.get('endDate') || undefined,
      }
      const incidents = await getIncidents(filters)
      return Response.json(incidents)
    }
    
    if (type === 'korgau') {
      const filters = {
        organization: searchParams.get('organization') || undefined,
        category: searchParams.get('category') || undefined,
        status: searchParams.get('status') || undefined,
        startDate: searchParams.get('startDate') || undefined,
        endDate: searchParams.get('endDate') || undefined,
      }
      const cards = await getKorgauCards(filters)
      return Response.json(cards)
    }
    
    if (type === 'stats') {
      const [incidentStats, korgauStats] = await Promise.all([
        getIncidentStats(),
        getKorgauStats(),
      ])
      return Response.json({ incidentStats, korgauStats })
    }
    
    if (type === 'filters') {
      const filters = await getFilterOptions()
      return Response.json(filters)
    }
    
    // Return all data by default
    const [incidents, korgauCards, incidentStats, korgauStats, filterOptions] = await Promise.all([
      getIncidents(),
      getKorgauCards(),
      getIncidentStats(),
      getKorgauStats(),
      getFilterOptions(),
    ])
    
    return Response.json({
      incidents,
      korgauCards,
      incidentStats,
      korgauStats,
      filterOptions,
    })
  } catch (error) {
    console.error('Data fetch error:', error)
    return Response.json(
      { error: 'Failed to fetch data' },
      { status: 500 }
    )
  }
}
