import { NextResponse } from 'next/server'
import { sql } from '@/lib/db'

type ImportType = 'incidents' | 'qorgau'
type ImportMode = 'append' | 'replace'

function normalize(value: string | undefined): string {
    return (value ?? '').trim()
}

function normalizeDate(raw: string | undefined): string | null {
    const value = normalize(raw)
    if (!value) return null

    if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
        return value
    }

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

function parseNumber(raw: string | undefined, fallback = 0): number {
    const value = normalize(raw).replace(',', '.')
    if (!value) return fallback
    const parsed = Number(value)
    return Number.isFinite(parsed) ? parsed : fallback
}

function isTruthy(raw: string | undefined): boolean {
    const value = normalize(raw).toUpperCase()
    return ['1', 'TRUE', 'YES', 'ДА', 'ИСТИНА'].includes(value)
}

function parseCsv(content: string): Array<Record<string, string>> {
    const lines = content
        .replace(/^\uFEFF/, '')
        .split(/\r?\n/)
        .filter((line) => line.trim().length > 0)

    if (lines.length < 2) return []

    const headerLine = lines[0]
    const delimiter = headerLine.includes(';') ? ';' : ','

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
            if (row.some((cell) => cell.trim().length > 0)) {
                rows.push(row)
            }
            row = []
            continue
        }

        field += char
    }

    if (field.length > 0 || row.length > 0) {
        row.push(field)
        if (row.some((cell) => cell.trim().length > 0)) {
            rows.push(row)
        }
    }

    if (rows.length < 2) return []

    const headers = rows[0].map((h) => h.replace(/^\uFEFF/, '').trim())
    return rows.slice(1).map((rawRow) => {
        const result: Record<string, string> = {}
        for (let i = 0; i < headers.length; i += 1) {
            result[headers[i]] = rawRow[i] ?? ''
        }
        return result
    })
}

function pick(obj: Record<string, string>, keys: string[]): string {
    for (const key of keys) {
        const value = obj[key]
        if (value !== undefined && normalize(value) !== '') {
            return value
        }
    }
    return ''
}

async function importIncidents(rows: Array<Record<string, string>>) {
    const normalized = rows
        .map((row) => {
            const date = normalizeDate(pick(row, ['date', 'Дата', 'Дата возникновения происшествия']))
            const organization = normalize(pick(row, ['organization', 'Организация', 'Наименование организации ДЗО']))
            const incidentType = normalize(pick(row, ['incident_type', 'Тип инцидента', 'Классификация НС', 'Инцидент']))
            const severity = normalize(pick(row, ['severity', 'Тяжесть', 'Тяжесть травмы'])) || 'medium'
            const description = normalize(pick(row, ['description', 'Описание', 'Краткое описание происшествия']))
            const location = normalize(pick(row, ['location', 'Место', 'Место происшествия']))
            const injuries = parseNumber(pick(row, ['injuries', 'Травмы']))
            const fatalities = parseNumber(pick(row, ['fatalities', 'Смертельные случаи']))

            if (!date || !organization || !incidentType) {
                return null
            }

            return {
                date,
                organization,
                incidentType,
                description: description || null,
                severity,
                location: location || null,
                injuries,
                fatalities,
            }
        })
        .filter((item): item is NonNullable<typeof item> => item !== null)

    if (normalized.length === 0) {
        return { inserted: 0, skipped: rows.length }
    }

    const batchSize = 200
    for (let offset = 0; offset < normalized.length; offset += batchSize) {
        const batch = normalized.slice(offset, offset + batchSize)
        const params: Array<string | number | null> = []

        const values = batch
            .map((row, index) => {
                const start = index * 8
                params.push(
                    row.date,
                    row.organization,
                    row.incidentType,
                    row.description,
                    row.severity,
                    row.location,
                    row.injuries,
                    row.fatalities,
                )

                return `($${start + 1}, $${start + 2}, $${start + 3}, $${start + 4}, $${start + 5}, $${start + 6}, $${start + 7}, $${start + 8})`
            })
            .join(',')

        await sql(
            `INSERT INTO incidents (date, organization, incident_type, description, severity, location, injuries, fatalities) VALUES ${values}`,
            params,
        )
    }

    return { inserted: normalized.length, skipped: rows.length - normalized.length }
}

async function importQorgau(rows: Array<Record<string, string>>) {
    const normalized = rows
        .map((row) => {
            const date = normalizeDate(pick(row, ['date', 'Дата']))
            const organization = normalize(pick(row, ['organization', 'Организация']))
            const observationType = normalize(pick(row, ['observation_type', 'Тип наблюдения']))
            const category = normalize(pick(row, ['category', 'Категория наблюдения']))
            const description = normalize(pick(row, ['description', 'Опишите ваше наблюдение/предложение']))
            const correctiveAction = normalize(pick(row, ['corrective_action', 'Какие меры вы предприняли?']))
            const statusRaw = normalize(pick(row, ['status', 'Статус']))
            const fixedRaw = pick(row, ['Было ли небезопасное условие / поведение исправлено и опасность устранена?'])
            const status = statusRaw || (isTruthy(fixedRaw) ? 'closed' : 'open')

            if (!date || !organization || !observationType || !category) {
                return null
            }

            return {
                date,
                organization,
                observationType,
                category,
                description: description || null,
                correctiveAction: correctiveAction || null,
                status,
            }
        })
        .filter((item): item is NonNullable<typeof item> => item !== null)

    if (normalized.length === 0) {
        return { inserted: 0, skipped: rows.length }
    }

    const batchSize = 200
    for (let offset = 0; offset < normalized.length; offset += batchSize) {
        const batch = normalized.slice(offset, offset + batchSize)
        const params: Array<string | null> = []

        const values = batch
            .map((row, index) => {
                const start = index * 7
                params.push(
                    row.date,
                    row.organization,
                    row.observationType,
                    row.category,
                    row.description,
                    row.correctiveAction,
                    row.status,
                )

                return `($${start + 1}, $${start + 2}, $${start + 3}, $${start + 4}, $${start + 5}, $${start + 6}, $${start + 7})`
            })
            .join(',')

        await sql(
            `INSERT INTO korgau_cards (date, organization, observation_type, category, description, corrective_action, status) VALUES ${values}`,
            params,
        )
    }

    return { inserted: normalized.length, skipped: rows.length - normalized.length }
}

export async function POST(request: Request) {
    try {
        const body = await request.json()
        const type = body?.type as ImportType
        const mode = (body?.mode as ImportMode) || 'append'
        const csvText = body?.csvText as string

        if (!type || !['incidents', 'qorgau'].includes(type)) {
            return NextResponse.json({ error: 'Некорректный тип импорта' }, { status: 400 })
        }

        if (!csvText || typeof csvText !== 'string') {
            return NextResponse.json({ error: 'CSV файл пустой или не передан' }, { status: 400 })
        }

        const rows = parseCsv(csvText)
        if (rows.length === 0) {
            return NextResponse.json({ error: 'Не удалось распознать строки CSV' }, { status: 400 })
        }

        if (mode === 'replace') {
            if (type === 'incidents') {
                await sql`TRUNCATE TABLE incidents RESTART IDENTITY`
            } else {
                await sql`TRUNCATE TABLE korgau_cards RESTART IDENTITY`
            }
        }

        const result = type === 'incidents' ? await importIncidents(rows) : await importQorgau(rows)

        return NextResponse.json({
            success: true,
            type,
            mode,
            parsedRows: rows.length,
            inserted: result.inserted,
            skipped: result.skipped,
        })
    } catch (error) {
        console.error('Import error:', error)
        return NextResponse.json({ error: 'Ошибка импорта CSV' }, { status: 500 })
    }
}
