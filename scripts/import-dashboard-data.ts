import { readFileSync, readdirSync } from 'fs'
import { join } from 'path'
import { config } from 'dotenv'
import { neon } from '@neondatabase/serverless'

config({ path: '.env.local' })

type IncidentInsert = {
    date: string
    organization: string
    incident_type: string
    description: string | null
    severity: string
    location: string | null
    injuries: number
    fatalities: number
}

type KorgauInsert = {
    date: string
    organization: string
    observation_type: string
    category: string
    description: string | null
    corrective_action: string | null
    status: string
}

const TRUTHY = new Set(['ИСТИНА', 'TRUE', 'YES', '1'])

function normalize(v: string | undefined): string {
    return (v ?? '').trim()
}

function clip(value: string, max: number): string {
    return value.length > max ? value.slice(0, max) : value
}

function isTruthy(v: string | undefined): boolean {
    return TRUTHY.has(normalize(v).toUpperCase())
}

function normalizeDate(raw: string | undefined): string | null {
    const value = normalize(raw)
    if (!value) return null

    const [datePart] = value.split(' ')
    const parts = datePart.split('.')
    if (parts.length !== 3) return null

    const [dd, mm, yyyy] = parts
    if (!dd || !mm || !yyyy) return null

    const day = dd.padStart(2, '0')
    const month = mm.padStart(2, '0')
    const year = yyyy.padStart(4, '0')
    return `${year}-${month}-${day}`
}

function parseCsv(content: string, delimiter = ';'): string[][] {
    const rows: string[][] = []
    let row: string[] = []
    let field = ''
    let inQuotes = false

    for (let i = 0; i < content.length; i += 1) {
        const char = content[i]

        if (char === '"') {
            const nextChar = content[i + 1]
            if (inQuotes && nextChar === '"') {
                field += '"'
                i += 1
            } else {
                inQuotes = !inQuotes
            }
            continue
        }

        if (char === delimiter && !inQuotes) {
            row.push(field)
            field = ''
            continue
        }

        if ((char === '\n' || char === '\r') && !inQuotes) {
            if (char === '\r' && content[i + 1] === '\n') {
                i += 1
            }
            row.push(field)
            field = ''

            const isMeaningfulRow = row.some((cell) => cell.trim().length > 0)
            if (isMeaningfulRow) {
                rows.push(row)
            }

            row = []
            continue
        }

        field += char
    }

    if (field.length > 0 || row.length > 0) {
        row.push(field)
        const isMeaningfulRow = row.some((cell) => cell.trim().length > 0)
        if (isMeaningfulRow) {
            rows.push(row)
        }
    }

    return rows
}

function rowsToObjects(rows: string[][]): Array<Record<string, string>> {
    if (rows.length === 0) return []

    const headers = rows[0].map((h) => h.replace(/^\uFEFF/, '').trim())
    const result: Array<Record<string, string>> = []

    for (const row of rows.slice(1)) {
        const obj: Record<string, string> = {}
        for (let i = 0; i < headers.length; i += 1) {
            obj[headers[i]] = row[i] ?? ''
        }
        result.push(obj)
    }

    return result
}

function getIncidentType(row: Record<string, string>): string {
    const byClassNs = normalize(row['Классификация НС'])
    const byClassIncident = normalize(row['Инцидент'])
    const byMedical = normalize(row['Оказание Медицинской помощи/микротравма'])

    return byClassNs || byClassIncident || byMedical || 'Инцидент'
}

function getIncidentSeverity(row: Record<string, string>): string {
    const explicit = normalize(row['Тяжесть травмы'])
    if (explicit) return explicit

    if (isTruthy(row['Несчастный случай'])) return 'high'
    if (isTruthy(row['Оказание Медицинской помощи/микротравма'])) return 'low'
    return 'medium'
}

function mapIncident(row: Record<string, string>): IncidentInsert | null {
    const date = normalizeDate(row['Дата возникновения происшествия'])
    const organization = normalize(row['Наименование организации ДЗО'])

    if (!date || !organization) {
        return null
    }

    return {
        date,
        organization: clip(organization, 255),
        incident_type: clip(getIncidentType(row), 100),
        description:
            normalize(row['Краткое описание происшествия']) ||
            normalize(row['Обстоятельства НС (Что произошло)']) ||
            null,
        severity: clip(getIncidentSeverity(row), 50),
        location: clip(normalize(row['Место происшествия']), 255) || null,
        injuries: 0,
        fatalities: 0,
    }
}

function mapKorgau(row: Record<string, string>): KorgauInsert | null {
    const date = normalizeDate(row['Дата'])
    const organization = normalize(row['Организация'])
    const observationType = normalize(row['Тип наблюдения'])
    const category = normalize(row['Категория наблюдения'])

    if (!date || !organization || !observationType || !category) {
        return null
    }

    const fixed = isTruthy(
        row['Было ли небезопасное условие / поведение исправлено и опасность устранена?']
    )

    return {
        date,
        organization: clip(organization, 255),
        observation_type: clip(observationType, 100),
        category: clip(category, 100),
        description: normalize(row['Опишите ваше наблюдение/предложение']) || null,
        corrective_action: normalize(row['Какие меры вы предприняли?']) || null,
        status: clip(fixed ? 'closed' : 'open', 50),
    }
}

async function insertIncidents(sql: ReturnType<typeof neon>, records: IncidentInsert[]) {
    const batchSize = 250

    for (let offset = 0; offset < records.length; offset += batchSize) {
        const batch = records.slice(offset, offset + batchSize)
        const params: Array<string | number | null> = []

        const valuesSql = batch
            .map((r, idx) => {
                const start = idx * 8
                params.push(
                    r.date,
                    r.organization,
                    r.incident_type,
                    r.description,
                    r.severity,
                    r.location,
                    r.injuries,
                    r.fatalities
                )

                return `($${start + 1}, $${start + 2}, $${start + 3}, $${start + 4}, $${start + 5}, $${start + 6}, $${start + 7}, $${start + 8})`
            })
            .join(',')

        const query = `
      INSERT INTO incidents (
        date, organization, incident_type, description, severity, location, injuries, fatalities
      ) VALUES ${valuesSql}
    `

        await sql(query, params)
    }
}

async function insertKorgau(sql: ReturnType<typeof neon>, records: KorgauInsert[]) {
    const batchSize = 250

    for (let offset = 0; offset < records.length; offset += batchSize) {
        const batch = records.slice(offset, offset + batchSize)
        const params: Array<string | null> = []

        const valuesSql = batch
            .map((r, idx) => {
                const start = idx * 7
                params.push(
                    r.date,
                    r.organization,
                    r.observation_type,
                    r.category,
                    r.description,
                    r.corrective_action,
                    r.status
                )

                return `($${start + 1}, $${start + 2}, $${start + 3}, $${start + 4}, $${start + 5}, $${start + 6}, $${start + 7})`
            })
            .join(',')

        const query = `
      INSERT INTO korgau_cards (
        date, organization, observation_type, category, description, corrective_action, status
      ) VALUES ${valuesSql}
    `

        await sql(query, params)
    }
}

function findRootCsvFiles() {
    const cwd = process.cwd()
    const files = readdirSync(cwd)

    const incidentsCsv = files.find((f) => f.toLowerCase() === 'incidents.csv')
    const korgauCsv = files.find((f) => {
        const lower = f.toLowerCase()
        return lower.endsWith('cards.csv') && lower !== 'incidents.csv'
    })

    if (!incidentsCsv || !korgauCsv) {
        throw new Error('CSV files not found in project root')
    }

    return {
        incidentsPath: join(cwd, incidentsCsv),
        korgauPath: join(cwd, korgauCsv),
    }
}

async function main() {
    const dbUrl = process.env.DATABASE_URL_UNPOOLED || process.env.DATABASE_URL
    if (!dbUrl) {
        throw new Error('DATABASE_URL_UNPOOLED or DATABASE_URL is required in .env.local')
    }

    const appendMode = process.argv.includes('--append')
    const { incidentsPath, korgauPath } = findRootCsvFiles()

    const incidentsRaw = readFileSync(incidentsPath, 'utf-8')
    const korgauRaw = readFileSync(korgauPath, 'utf-8')

    const incidentRows = rowsToObjects(parseCsv(incidentsRaw, ';'))
    const korgauRows = rowsToObjects(parseCsv(korgauRaw, ';'))

    const incidents = incidentRows.map(mapIncident).filter((r): r is IncidentInsert => r !== null)
    const korgauCards = korgauRows.map(mapKorgau).filter((r): r is KorgauInsert => r !== null)

    const sql = neon(dbUrl)

    if (!appendMode) {
        await sql`TRUNCATE TABLE korgau_cards RESTART IDENTITY`
        await sql`TRUNCATE TABLE incidents RESTART IDENTITY`
    }

    await insertIncidents(sql, incidents)
    await insertKorgau(sql, korgauCards)

    const [incidentCount] = await sql`SELECT COUNT(*)::int as count FROM incidents`
    const [korgauCount] = await sql`SELECT COUNT(*)::int as count FROM korgau_cards`

    console.log(`Incidents imported: ${incidents.length}`)
    console.log(`Korgau cards imported: ${korgauCards.length}`)
    console.log(`DB incidents total: ${incidentCount?.count ?? 0}`)
    console.log(`DB korgau cards total: ${korgauCount?.count ?? 0}`)
}

main().catch((error) => {
    console.error('Import failed:', error)
    process.exit(1)
})
