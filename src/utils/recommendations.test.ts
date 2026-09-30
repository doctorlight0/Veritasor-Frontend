import { describe, it, expect } from 'vitest'
import {
  computeRecommendationScore,
  generateExplanation,
  type Purchase,
  type Campaign,
  type Geography,
  type EnvironmentalCause,
} from './recommendations'

const oakPurchase: Purchase = {
  id: 'p1',
  productName: 'Oak sapling',
  category: 'oak',
  amount: 50,
  date: '2026-01-15',
}

const maplePurchase: Purchase = {
  id: 'p2',
  productName: 'Maple tree',
  category: 'maple',
  amount: 75,
  date: '2026-02-20',
}

const pinePurchase: Purchase = {
  id: 'p3',
  productName: 'Pine cone',
  category: 'pine',
  amount: 30,
  date: '2026-03-10',
}

const _mixedPurchases: Purchase[] = [oakPurchase, maplePurchase, pinePurchase]

const _userGeography: Geography = 'north-america'
const _userCause: EnvironmentalCause = 'reforestation'

const _reforestationCampaign: Campaign = {
  id: 'c1',
  name: 'Reforestation Initiative',
  description: 'Plant native trees to restore forests',
  cause: 'reforestation',
  targetTreeSpecies: ['oak', 'maple'],
  targetGeography: ['north-america', 'europe'],
  minSpend: 40,
}

const _conservationCampaign: Campaign = {
  id: 'c2',
  name: 'Conservation Effort',
  description: 'Protect existing forests and wildlife',
  cause: 'conservation',
  targetTreeSpecies: ['pine'],
  targetGeography: ['asia'],
  minSpend: 100,
}

describe('recommendation scoring', () => {
  it('should compute zero score when no purchases match and no other factors apply', () => {
    const campaign: Campaign = {
      id: 'c3',
      name: 'Test Campaign',
      description: 'test',
      cause: 'climate',
      targetTreeSpecies: ['oak'],
      targetGeography: ['africa'],
      minSpend: 1000,
    }
    const _score = computeRecommendationScore(
      [],
      'europe',
      'conservation',
      campaign,
    ).score
    expect(_score).toBe(0)
  })

  it('should award purchase points when purchase amount meets minSpend', () => {
    const { factors, score: _score2 } = computeRecommendationScore(
      [oakPurchase],
      'north-america',
      'reforestation',
      _reforestationCampaign,
    )
    expect(_score2).toBeGreaterThan(0)
    expect(factors.purchaseScore).toBe(1)
  })

  it('should award species points when purchase category matches target tree species', () => {
    const { factors } = computeRecommendationScore(
      [oakPurchase],
      'north-america',
      'reforestation',
      _reforestationCampaign,
    )
    expect(factors.speciesScore).toBe(2)
  })

  it('should award geography points when user geography matches campaign target', () => {
    const { factors } = computeRecommendationScore(
      [oakPurchase],
      'north-america',
      'reforestation',
      _reforestationCampaign,
    )
    expect(factors.geographyScore).toBe(3)
  })

  it('should award cause points when user cause matches campaign cause', () => {
    const { factors } = computeRecommendationScore(
      [oakPurchase],
      'north-america',
      'reforestation',
      _reforestationCampaign,
    )
    expect(factors.causeScore).toBe(5)
  })

  it('should compute total score as sum of all factor scores', () => {
    const { factors, score: _score3 } = computeRecommendationScore(
      [oakPurchase],
      'north-america',
      'reforestation',
      _reforestationCampaign,
    )
    expect(_score3).toBe(factors.purchaseScore + factors.speciesScore + factors.geographyScore + factors.causeScore)
  })

  it('should generate explanation string with all matching factors', () => {
    const { factors } = computeRecommendationScore(
      [oakPurchase],
      'north-america',
      'reforestation',
      _reforestationCampaign,
    )
    const explanation = generateExplanation(factors, _reforestationCampaign)
    expect(explanation).toContain('+1 points for purchase history')
    expect(explanation).toContain('+2 points for tree species match')
    expect(explanation).toContain('+3 points for geography alignment')
    expect(explanation).toContain('+5 points for cause alignment')
  })

  it('should generate explanation with only matching factors', () => {
    const { factors } = computeRecommendationScore(
      [],
      'europe',
      'conservation',
      _conservationCampaign,
    )
    const explanation = generateExplanation(factors, _conservationCampaign)
    expect(explanation).not.toContain('+1 points for purchase history')
    expect(explanation).not.toContain('+3 points for geography alignment')
    expect(explanation).toContain('+5 points for cause alignment')
  })

  it('should handle geography mismatch', () => {
    const { factors } = computeRecommendationScore(
      [oakPurchase],
      'asia',
      'reforestation',
      _reforestationCampaign,
    )
    expect(factors.geographyScore).toBe(0)
    const _score4 = computeRecommendationScore(
      [oakPurchase],
      'asia',
      'reforestation',
      _reforestationCampaign,
    ).score
    expect(_score4).toBeLessThan(11)
  })

  it('should handle cause mismatch', () => {
    const { factors } = computeRecommendationScore(
      [oakPurchase],
      'north-america',
      'climate',
      _reforestationCampaign,
    )
    expect(factors.causeScore).toBe(0)
    const _score5 = computeRecommendationScore(
      [oakPurchase],
      'north-america',
      'climate',
      _reforestationCampaign,
    ).score
    expect(_score5).toBeLessThan(11)
  })
})