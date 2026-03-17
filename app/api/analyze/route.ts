import { generateText, Output } from 'ai'
import { createGoogleGenerativeAI } from '@ai-sdk/google'
import { z } from 'zod'

const google = createGoogleGenerativeAI({
  apiKey: process.env.GOOGLE_GENERATIVE_AI_API_KEY,
})
import { getIncidents, getKorgauCards, getIncidentStats, getKorgauStats } from '@/lib/db'

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

export async function GET() {
  try {
    const [incidents, korgauCards, incidentStats, korgauStats] = await Promise.all([
      getIncidents(),
      getKorgauCards(),
      getIncidentStats(),
      getKorgauStats(),
    ])

    const dataSnapshot = {
      incidents: incidents.slice(0, 50),
      korgauCards: korgauCards.slice(0, 100),
      incidentStats,
      korgauStats,
      currentDate: new Date().toISOString().split('T')[0],
    }

    const systemPrompt = `You are an expert HSE (Health, Safety, and Environment) analyst for oil and gas operations in Kazakhstan. 
Your task is to analyze safety data and provide actionable insights.

IMPORTANT INSTRUCTIONS:
1. Analyze the provided incident and Korgau card data thoroughly
2. Calculate realistic forecasts based on historical trends
3. Identify systematic patterns in safety violations
4. Provide specific, actionable recommendations
5. Calculate economic impact in Kazakhstani Tenge (1 USD ≈ 450 KZT)
6. Consider industry-specific risks for oil & gas operations
7. The "lives saved" metric should be based on prevented incidents from near-misses and early interventions
8. Money saved should account for avoided medical costs, lost work days, equipment damage, and regulatory fines

Current statistics:
- Total incidents: ${incidentStats.totalIncidents}
- Total injuries: ${incidentStats.totalInjuries}
- Total fatalities: ${incidentStats.totalFatalities}
- Total work days lost: ${incidentStats.totalWorkDaysLost}
- Total cost: ${incidentStats.totalCost} KZT
- Total Korgau observations: ${korgauStats.totalCards}
- Open safety cards: ${korgauStats.openCards}`

    const { output } = await generateText({
      model: google('gemini-3.1-flash-lite-preview'),
      output: Output.object({ schema: analysisSchema }),
      system: systemPrompt,
      prompt: `Analyze this HSE safety data and provide comprehensive analysis:

${JSON.stringify(dataSnapshot, null, 2)}

Provide a complete analysis including:
1. Summary statistics with economic effect calculations (lives saved, money saved)
2. Incident forecasts for 3, 6, and 12 months with confidence intervals
3. Top 5 risk zones (organizations) with probability scores
4. At least 3 specific safety recommendations
5. Korgau alerts for systematic violations
6. Trend analysis with monthly data`,
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
