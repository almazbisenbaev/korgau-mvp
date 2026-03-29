import { neon } from '@neondatabase/serverless'

export const sql = neon(process.env.DATABASE_URL!)

export interface Incident {
  id: number
  date: string
  organization: string
  incident_type: string
  description: string
  severity: string
  location: string
  injuries: number
  fatalities: number
  estimated_cost: string | null
  work_days_lost: number | null
  created_at: string
}

export interface KorgauCard {
  id: number
  date: string
  organization: string
  observer_name: string
  observation_type: string
  category: string
  description: string
  location: string
  risk_level: string
  status: string
  corrective_action: string
  action_deadline: string
  created_at: string
}

interface IncidentFilters {
  organization?: string
  incident_type?: string
  startDate?: string
  endDate?: string
}

function buildIncidentFilterClause(filters?: IncidentFilters) {
  const params: string[] = []
  const conditions: string[] = []

  if (filters?.organization) {
    params.push(filters.organization)
    conditions.push(`organization = $${params.length}`)
  }
  if (filters?.incident_type) {
    params.push(filters.incident_type)
    conditions.push(`incident_type = $${params.length}`)
  }
  if (filters?.startDate) {
    params.push(filters.startDate)
    conditions.push(`date >= $${params.length}`)
  }
  if (filters?.endDate) {
    params.push(filters.endDate)
    conditions.push(`date <= $${params.length}`)
  }

  const whereClause = conditions.length > 0 ? ` WHERE ${conditions.join(' AND ')}` : ''

  return { whereClause, params }
}

export async function getIncidents(filters?: IncidentFilters) {
  const { whereClause, params } = buildIncidentFilterClause(filters)
  const query = `SELECT * FROM incidents${whereClause} ORDER BY date DESC`

  const result = await sql(query, params)
  return result as Incident[]
}

export async function getKorgauCards(filters?: {
  organization?: string
  category?: string
  status?: string
  startDate?: string
  endDate?: string
}) {
  let query = 'SELECT * FROM korgau_cards WHERE 1=1'
  const params: (string | undefined)[] = []
  let paramIndex = 1

  if (filters?.organization) {
    query += ` AND organization = $${paramIndex++}`
    params.push(filters.organization)
  }
  if (filters?.category) {
    query += ` AND category = $${paramIndex++}`
    params.push(filters.category)
  }
  if (filters?.status) {
    query += ` AND status = $${paramIndex++}`
    params.push(filters.status)
  }
  if (filters?.startDate) {
    query += ` AND date >= $${paramIndex++}`
    params.push(filters.startDate)
  }
  if (filters?.endDate) {
    query += ` AND date <= $${paramIndex++}`
    params.push(filters.endDate)
  }

  query += ' ORDER BY date DESC'

  const result = await sql(query, params)
  return result as KorgauCard[]
}

export async function getIncidentStats(filters?: IncidentFilters) {
  const { whereClause, params } = buildIncidentFilterClause(filters)

  const [
    totalIncidents,
    totalInjuries,
    totalFatalities,
    totalWorkDaysLost,
    totalCost,
    incidentsByType,
    incidentsByOrg,
    incidentsByMonth,
    incidentsBySeverity
  ] = await Promise.all([
    sql(`SELECT COUNT(*) as count FROM incidents${whereClause}`, params),
    sql(`SELECT COALESCE(SUM(injuries), 0) as total FROM incidents${whereClause}`, params),
    sql(`SELECT COALESCE(SUM(fatalities), 0) as total FROM incidents${whereClause}`, params),
    sql(`SELECT COALESCE(SUM(COALESCE((to_jsonb(incidents)->>'work_days_lost')::numeric, 0)), 0) as total FROM incidents${whereClause}`, params),
    sql(`SELECT COALESCE(SUM(COALESCE((to_jsonb(incidents)->>'estimated_cost')::numeric, (to_jsonb(incidents)->>'economic_loss')::numeric, 0)), 0) as total FROM incidents${whereClause}`, params),
    sql(`SELECT incident_type, COUNT(*) as count FROM incidents${whereClause} GROUP BY incident_type ORDER BY count DESC`, params),
    sql(`SELECT organization, COUNT(*) as count FROM incidents${whereClause} GROUP BY organization ORDER BY count DESC`, params),
    sql(`SELECT TO_CHAR(date, 'YYYY-MM') as month, COUNT(*) as count FROM incidents${whereClause} GROUP BY TO_CHAR(date, 'YYYY-MM') ORDER BY month`, params),
    sql(`SELECT severity, COUNT(*) as count FROM incidents${whereClause} GROUP BY severity`, params)
  ])

  return {
    totalIncidents: Number(totalIncidents[0]?.count ?? 0),
    totalInjuries: Number(totalInjuries[0]?.total ?? 0),
    totalFatalities: Number(totalFatalities[0]?.total ?? 0),
    totalWorkDaysLost: Number(totalWorkDaysLost[0]?.total ?? 0),
    totalCostTenge: Number(totalCost[0]?.total ?? 0),
    incidentsByType: (incidentsByType as any[]).map(i => ({ ...i, count: Number(i.count) })),
    incidentsByOrg: (incidentsByOrg as any[]).map(i => ({ ...i, count: Number(i.count) })),
    incidentsByMonth: (incidentsByMonth as any[]).map(i => ({ ...i, count: Number(i.count) })),
    incidentsBySeverity: (incidentsBySeverity as any[]).map(i => ({ ...i, count: Number(i.count) }))
  }
}

export async function getKorgauStats() {
  const [
    totalCards,
    openCards,
    cardsByCategory,
    cardsByOrg,
    cardsByRiskLevel,
    cardsByType
  ] = await Promise.all([
    sql`SELECT COUNT(*) as count FROM korgau_cards`,
    sql`SELECT COUNT(*) as count FROM korgau_cards WHERE status = 'open'`,
    sql`SELECT category, COUNT(*) as count FROM korgau_cards GROUP BY category ORDER BY count DESC`,
    sql`SELECT organization, COUNT(*) as count FROM korgau_cards GROUP BY organization ORDER BY count DESC`,
    sql`
      SELECT
        CASE
          WHEN LOWER(observation_type) LIKE '%опасный случай%' THEN 'critical'
          WHEN LOWER(observation_type) LIKE '%опасный фактор%' THEN 'high'
          WHEN LOWER(observation_type) LIKE '%небезопасное%' THEN 'medium'
          ELSE 'low'
        END as risk_level,
        COUNT(*) as count
      FROM korgau_cards
      GROUP BY 1
      ORDER BY count DESC
    `,
    sql`SELECT observation_type, COUNT(*) as count FROM korgau_cards GROUP BY observation_type`
  ])

  return {
    totalCards: Number(totalCards[0]?.count || 0),
    openCards: Number(openCards[0]?.count || 0),
    cardsByCategory: (cardsByCategory as any[]).map(i => ({ ...i, count: Number(i.count) })),
    cardsByOrg: (cardsByOrg as any[]).map(i => ({ ...i, count: Number(i.count) })),
    cardsByRiskLevel: (cardsByRiskLevel as any[]).map(i => ({ ...i, count: Number(i.count) })),
    cardsByType: (cardsByType as any[]).map(i => ({ ...i, count: Number(i.count) }))
  }
}

export async function getFilterOptions() {
  const [organizations, incidentTypes, categories] = await Promise.all([
    sql`SELECT DISTINCT organization FROM incidents ORDER BY organization`,
    sql`SELECT DISTINCT incident_type FROM incidents ORDER BY incident_type`,
    sql`SELECT DISTINCT category FROM korgau_cards ORDER BY category`
  ])

  return {
    organizations: (organizations as any[]).map((o) => o.organization),
    incidentTypes: (incidentTypes as any[]).map((t) => t.incident_type),
    categories: (categories as any[]).map((c) => c.category)
  }
}
