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

export async function getIncidents(filters?: {
  organization?: string
  incident_type?: string
  startDate?: string
  endDate?: string
}) {
  let query = 'SELECT * FROM incidents WHERE 1=1'
  const params: (string | undefined)[] = []
  let paramIndex = 1

  if (filters?.organization) {
    query += ` AND organization = $${paramIndex++}`
    params.push(filters.organization)
  }
  if (filters?.incident_type) {
    query += ` AND incident_type = $${paramIndex++}`
    params.push(filters.incident_type)
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

export async function getIncidentStats() {
  const [
    totalIncidents,
    totalInjuries,
    totalFatalities,
    incidentsByType,
    incidentsByOrg,
    incidentsByMonth,
    incidentsBySeverity
  ] = await Promise.all([
    sql`SELECT COUNT(*) as count FROM incidents`,
    sql`SELECT COALESCE(SUM(injuries), 0) as total FROM incidents`,
    sql`SELECT COALESCE(SUM(fatalities), 0) as total FROM incidents`,
    sql`SELECT incident_type, COUNT(*) as count FROM incidents GROUP BY incident_type ORDER BY count DESC`,
    sql`SELECT organization, COUNT(*) as count FROM incidents GROUP BY organization ORDER BY count DESC`,
    sql`SELECT TO_CHAR(date, 'YYYY-MM') as month, COUNT(*) as count FROM incidents GROUP BY TO_CHAR(date, 'YYYY-MM') ORDER BY month`,
    sql`SELECT severity, COUNT(*) as count FROM incidents GROUP BY severity`
  ])

  return {
    totalIncidents: Number(totalIncidents[0]?.count ?? 0),
    totalInjuries: Number(totalInjuries[0]?.total ?? 0),
    totalFatalities: Number(totalFatalities[0]?.total ?? 0),
    incidentsByType: (incidentsByType as any[]).map(i => ({...i, count: Number(i.count)})),
    incidentsByOrg: (incidentsByOrg as any[]).map(i => ({...i, count: Number(i.count)})),
    incidentsByMonth: (incidentsByMonth as any[]).map(i => ({...i, count: Number(i.count)})),
    incidentsBySeverity: (incidentsBySeverity as any[]).map(i => ({...i, count: Number(i.count)}))
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
    sql`SELECT risk_level, COUNT(*) as count FROM korgau_cards GROUP BY risk_level`,
    sql`SELECT observation_type, COUNT(*) as count FROM korgau_cards GROUP BY observation_type`
  ])

  return {
    totalCards: Number(totalCards[0]?.count || 0),
    openCards: Number(openCards[0]?.count || 0),
    cardsByCategory,
    cardsByOrg,
    cardsByRiskLevel,
    cardsByType
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
