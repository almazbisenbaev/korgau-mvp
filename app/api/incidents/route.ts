import { getIncidents, sql } from '@/lib/db'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const organization = searchParams.get('organization') || undefined
    const incident_type = searchParams.get('incident_type') || undefined
    const startDate = searchParams.get('startDate') || undefined
    const endDate = searchParams.get('endDate') || undefined

    const incidents = await getIncidents({
      organization,
      incident_type,
      startDate,
      endDate,
    })

    return NextResponse.json(incidents)
  } catch (error) {
    console.error('Ошибка при получении инцидентов:', error)
    return NextResponse.json(
      { error: 'Не удалось получить инциденты' },
      { status: 500 }
    )
  }
}


export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { 
      date, 
      organization, 
      incident_type, 
      description, 
      severity, 
      location, 
      injuries, 
      fatalities, 
      economic_loss 
    } = body

    if (!date || !organization || !incident_type || !severity) {
      return NextResponse.json(
        { error: 'Отсутствуют обязательные поля' },
        { status: 400 }
      )
    }

    const result = await sql`
      INSERT INTO incidents (
        date, 
        organization, 
        incident_type, 
        description, 
        severity, 
        location, 
        injuries, 
        fatalities, 
        economic_loss
      ) VALUES (
        ${date}, 
        ${organization}, 
        ${incident_type}, 
        ${description}, 
        ${severity}, 
        ${location}, 
        ${injuries || 0}, 
        ${fatalities || 0}, 
        ${economic_loss || 0}
      ) RETURNING id
    `

    return NextResponse.json({ success: true, id: result[0].id })
  } catch (error) {
    console.error('Ошибка при создании инцидента:', error)
    return NextResponse.json(
      { error: 'Не удалось сохранить инцидент' },
      { status: 500 }
    )
  }
}
