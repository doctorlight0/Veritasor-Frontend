export interface Purchase {
  id: string
  productName: string
  category: string
  amount: number
  date: string
}

export type TreeSpecies =
  | 'oak'
  | 'maple'
  | 'pine'
  | 'fruit'
  | 'palm'
  | 'birch'
  | 'cedar'

export type Geography = 'north-america' | 'europe' | 'asia' | 'africa' | 'south-america' | 'oceania'

export type EnvironmentalCause =
  | 'reforestation'
  | 'conservation'
  | 'climate'
  | 'biodiversity'

export interface Campaign {
  id: string
  name: string
  description: string
  cause: EnvironmentalCause
  targetTreeSpecies: TreeSpecies[]
  targetGeography: Geography[]
  minSpend?: number
}

export interface Recommendation {
  campaign: Campaign
  score: number
  explanation: string
}

export interface RecommendationFactors {
  purchaseScore: number
  speciesScore: number
  geographyScore: number
  causeScore: number
}

const WEIGHTS = {
  purchase: 1,
  species: 2,
  geography: 3,
  cause: 5,
} as const

function computePurchaseScore(purchases: Purchase[], campaign: Campaign): number {
  if (!campaign.minSpend && campaign.targetTreeSpecies.length === 0) return 0
  let score = 0
  for (const p of purchases) {
    const matchesCategory = campaign.targetTreeSpecies.some(
      (species) => getSpeciesFromCategory(p.category) === species,
    )
    if (matchesCategory || p.amount >= (campaign.minSpend ?? 0)) {
      score += WEIGHTS.purchase
    }
  }
  return score
}

function getSpeciesFromCategory(category: string): TreeSpecies | undefined {
  const map: Record<string, TreeSpecies> = {
    oak: 'oak',
    maple: 'maple',
    pine: 'pine',
    fruit: 'fruit',
    palm: 'palm',
    birch: 'birch',
    cedar: 'cedar',
  }
  return map[category as keyof typeof map]
}

function computeSpeciesScore(purchases: Purchase[], campaign: Campaign): number {
  let score = 0
  for (const p of purchases) {
    const species = getSpeciesFromCategory(p.category)
    if (campaign.targetTreeSpecies.includes(species)) {
      score += WEIGHTS.species
    }
  }
  return score
}

function computeGeographyScore(userGeography: Geography, campaign: Campaign): number {
  if (campaign.targetGeography.includes(userGeography)) {
    return WEIGHTS.geography
  }
  return 0
}

function computeCauseScore(userCause: EnvironmentalCause, campaign: Campaign): number {
  if (userCause === campaign.cause) {
    return WEIGHTS.cause
  }
  return 0
}

export function computeRecommendationScore(
  purchases: Purchase[],
  userGeography: Geography,
  userCause: EnvironmentalCause,
  campaign: Campaign,
): { score: number; factors: RecommendationFactors } {
  const purchaseScore = computePurchaseScore(purchases, campaign)
  const speciesScore = computeSpeciesScore(purchases, campaign)
  const geographyScore = computeGeographyScore(userGeography, campaign)
  const causeScore = computeCauseScore(userCause, campaign)

  const totalScore = purchaseScore + speciesScore + geographyScore + causeScore

  return {
    score: totalScore,
    factors: {
      purchaseScore,
      speciesScore,
      geographyScore,
      causeScore,
    },
  }
}

export function generateExplanation(
  factors: RecommendationFactors,
  campaign: Campaign,
): string {
  const parts: string[] = []

  if (factors.purchaseScore > 0) {
    parts.push(`+${factors.purchaseScore} points for purchase history`)
  }
  if (factors.speciesScore > 0) {
    parts.push(`+${factors.speciesScore} points for tree species match`)
  }
  if (factors.geographyScore > 0) {
    parts.push(`+${factors.geographyScore} points for geography alignment`)
  }
  if (factors.causeScore > 0) {
    parts.push(`+${factors.causeScore} points for cause alignment`)
  }

  const scoreText = parts.join(', ')
  return `Recommendation: ${campaign.name} — ${scoreText}. ${campaign.description}`
}