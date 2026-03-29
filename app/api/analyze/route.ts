import { generateText, Output } from 'ai'
import { createGoogleGenerativeAI } from '@ai-sdk/google'
import { z } from 'zod'

const google = createGoogleGenerativeAI({
  apiKey: process.env.GOOGLE_GENERATIVE_AI_API_KEY,
})
import { getIncidents, getKorgauCards, getIncidentStats, getKorgauStats } from '@/lib/db'

function getFilterValue(value: string | null) {
  if (!value || value === 'all') {
    return undefined
  }
  return value
}

const analysisSchema = z.object({
  summary: z.object({
    totalIncidents: z.number(),
    totalInjuries: z.number(),
    totalFatalities: z.number(),
    totalWorkDaysLost: z.number(),
    totalCostTenge: z.number(),
    livesSaved: z.number().describe('Estimated lives saved through safety interventions based on near-miss data and trend improvements'),
    moneySavedTenge: z.number().describe('Estimated money saved in Tenge through preventive measures'),
    safetyScore: z.number().min(0).max(100).describe('Overall safety performance score 0-100'),
  }),
  forecasts: z.object({
    threeMonths: z.object({
      predictedIncidents: z.number(),
      confidenceInterval: z.object({ low: z.number(), high: z.number() }),
      trend: z.enum(['increasing', 'decreasing', 'stable']),
    }),
    sixMonths: z.object({
      predictedIncidents: z.number(),
      confidenceInterval: z.object({ low: z.number(), high: z.number() }),
      trend: z.enum(['increasing', 'decreasing', 'stable']),
    }),
    twelveMonths: z.object({
      predictedIncidents: z.number(),
      confidenceInterval: z.object({ low: z.number(), high: z.number() }),
      trend: z.enum(['increasing', 'decreasing', 'stable']),
    }),
  }),
  topRiskZones: z.array(z.object({
    rank: z.number(),
    organization: z.string(),
    riskScore: z.number().min(0).max(100),
    primaryRiskFactors: z.array(z.string()),
    predictedIncidentProbability: z.number().min(0).max(100).describe('Percentage probability of incident in next 3 months'),
    recommendedActions: z.array(z.string()),
  })).length(5),
  recommendations: z.array(z.object({
    priority: z.enum(['critical', 'high', 'medium']),
    title: z.string(),
    description: z.string(),
    expectedImpact: z.string(),
    targetOrganizations: z.array(z.string()),
    estimatedCostSavingsTenge: z.number(),
  })).min(3),
  korgauAlerts: z.array(z.object({
    alertType: z.enum(['systematic_violation', 'emerging_trend', 'critical_risk']),
    category: z.string(),
    description: z.string(),
    affectedOrganizations: z.array(z.string()),
    frequency: z.number().describe('Number of similar observations'),
    severity: z.enum(['critical', 'high', 'medium']),
    recommendedIntervention: z.string(),
  })),
  trendAnalysis: z.object({
    incidentTrendByMonth: z.array(z.object({
      month: z.string(),
      actual: z.number(),
      predicted: z.number().nullable(),
    })),
    topIncidentTypes: z.array(z.object({
      type: z.string(),
      count: z.number(),
      percentageChange: z.number().describe('Percentage change from previous period'),
    })),
    topViolationCategories: z.array(z.object({
      category: z.string(),
      count: z.number(),
      riskLevel: z.enum(['critical', 'high', 'medium', 'low']),
    })),
  }),
})

export type SafetyAnalysis = z.infer<typeof analysisSchema>

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const incidentFilters = {
      organization: getFilterValue(searchParams.get('organization')),
      incident_type: getFilterValue(searchParams.get('incident_type')),
      startDate: getFilterValue(searchParams.get('startDate')),
      endDate: getFilterValue(searchParams.get('endDate')),
    }

    const [incidents, korgauCards, incidentStats, korgauStats] = await Promise.all([
      getIncidents(incidentFilters),
      getKorgauCards(),
      getIncidentStats(incidentFilters),
      getKorgauStats(),
    ])

    const dataSnapshot = {
      incidents: incidents.slice(0, 50),
      korgauCards: korgauCards.slice(0, 100),
      incidentStats,
      korgauStats,
      currentDate: new Date().toISOString().split('T')[0],
    }

    const systemPrompt = `Ты экспертом-аналитик по ОТ, ТБ и ООС (HSE) для нефтегазовых операций в Казахстане. 
твоя задача — проанализировать данные по безопасности и предоставить практические выводы.

ВАЖНЫЕ ИНСТРУКЦИИ:
1. Тщательно проанализируй предоставленные данные об инцидентах и картах Qorgau.
2. Рассчитайте реалистичные прогнозы на основе исторических трендов.
3. Выявите систематические закономерности в нарушениях безопасности.
4. Предоставьте конкретные, выполнимые рекомендации.
5. Рассчитайте экономический эффект в казахстанских тенге (1 USD ≈ 450 KZT).
6. Учитывайте специфические отраслевые риски для нефтегазовых операций.
7. Показатель «спасенных жизней» должен основываться на предотвращенных инцидентах на основе данных о потенциально опасных ситуациях (near-misses) и ранних вмешательствах.
8. Сэкономленные деньги должны учитывать предотвращенные медицинские расходы, потерянные рабочие дни, повреждение оборудования и нормативные штрафы.

Текущая статистика:
- Всего инцидентов: ${incidentStats.totalIncidents}
- Всего травм: ${incidentStats.totalInjuries}
- Смертельных случаев: ${incidentStats.totalFatalities}
- Потеряно рабочих дней: ${incidentStats.totalWorkDaysLost}
- Общая стоимость: ${incidentStats.totalCost} KZT
- Всего наблюдений Qorgau: ${korgauStats.totalCards}
- Открытых карт безопасности: ${korgauStats.openCards}`

    const { output } = await generateText({
      model: google('gemini-2.5-flash-lite'),
      // model: google('gemini-3.1-flash-lite-preview'),
      output: Output.object({ schema: analysisSchema }),
      system: systemPrompt,
      prompt: `Проанализируйте эти данные по безопасности ОТ, ТБ и ООС и предоставьте комплексный анализ на РУССКОМ ЯЗЫКЕ:

${JSON.stringify(dataSnapshot, null, 2)}

Предоставь полный анализ, включающий:
1. Сводную статистику с расчетами экономического эффекта (спасенные жизни, сэкономленные деньги).
2. Прогнозы инцидентов на 3, 6 и 12 месяцев с доверительными интервалами.
3. Топ-5 зон риска (организаций) с оценками вероятности.
4. Минимум 3 конкретные рекомендации по безопасности.
5. Уведомления Qorgau о систематических нарушениях.
6. Анализ трендов с ежемесячными данными.`,
    })

    return Response.json(output)
  } catch (error) {
    console.error('Analysis error:', error)
    return Response.json(
      { error: 'Failed to generate analysis' },
      { status: 500 }
    )
  }
}
