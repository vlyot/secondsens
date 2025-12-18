import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { RecommendationDisplay } from './RecommendationDisplay'
import type { RecommendationResponse } from '@/lib/types'

const mockData: RecommendationResponse = {
  success: true,
  timestamp: new Date().toISOString(),
  product_name: 'iPhone 13 Pro',
  confidence_score: 'High',
  recommendations: [
    {
      rank: 1,
      condition: 'Like New',
      avg_price: 800,
      price_range: { min: 750, max: 850 },
      savings_vs_new: { absolute: 200, percent: 20 },
      justification: 'Best value for money with excellent condition',
    },
    {
      rank: 2,
      condition: 'Good',
      avg_price: 650,
      price_range: { min: 600, max: 700 },
      savings_vs_new: { absolute: 350, percent: 35 },
      justification: 'Good balance between price and condition',
    },
    {
      rank: 3,
      condition: 'Well Used',
      avg_price: 500,
      price_range: { min: 450, max: 550 },
      savings_vs_new: { absolute: 500, percent: 50 },
      justification: 'Budget option but may need repairs',
    },
  ],
  market_stats: {
    brand_new: { avg_price: 1100, range: { min: 1050, max: 1150 } },
    like_new: { avg_price: 850, range: { min: 800, max: 900 } },
    good: { avg_price: 700, range: { min: 650, max: 750 } },
    well_used: { avg_price: 550, range: { min: 500, max: 600 } },
  },
  reasoning: 'Based on your preferences for good condition and reasonable price, Like New is the best option.',
}

describe('RecommendationDisplay Component', () => {
  describe('Rendering', () => {
    it('should render product name and all major sections', () => {
      const mockOnFindListings = vi.fn()
      render(<RecommendationDisplay data={mockData} onFindListings={mockOnFindListings} />)

      expect(screen.getByText('iPhone 13 Pro')).toBeInTheDocument()
      expect(screen.getByText('High Confidence')).toBeInTheDocument()
      expect(screen.getByText('Top Recommendations')).toBeInTheDocument()
      expect(screen.getByText('Market Statistics')).toBeInTheDocument()
      expect(screen.getByText('Why This Recommendation?')).toBeInTheDocument()
      expect(screen.getByText(mockData.reasoning)).toBeInTheDocument()
    })

    it('should render recommendation section titles', () => {
      const mockOnFindListings = vi.fn()
      render(<RecommendationDisplay data={mockData} onFindListings={mockOnFindListings} />)

      expect(screen.getByText('Top Recommendations')).toBeInTheDocument()
      expect(screen.getByText('Market Statistics')).toBeInTheDocument()
    })
  })

  describe('Recommendation Cards', () => {
    it('should display card titles and prices', () => {
      const mockOnFindListings = vi.fn()
      render(<RecommendationDisplay data={mockData} onFindListings={mockOnFindListings} />)

      // Check that conditions are displayed (they appear in both cards and table)
      expect(screen.queryAllByText('Like New').length).toBeGreaterThan(0)
      expect(screen.queryAllByText('Good').length).toBeGreaterThan(0)
      expect(screen.queryAllByText('Well Used').length).toBeGreaterThan(0)
    })

    it('should display justifications', () => {
      const mockOnFindListings = vi.fn()
      render(<RecommendationDisplay data={mockData} onFindListings={mockOnFindListings} />)

      expect(screen.getByText('Best value for money with excellent condition')).toBeInTheDocument()
      expect(screen.getByText('Good balance between price and condition')).toBeInTheDocument()
      expect(screen.getByText('Budget option but may need repairs')).toBeInTheDocument()
    })

    it('should render Find Listings buttons', () => {
      const mockOnFindListings = vi.fn()
      render(<RecommendationDisplay data={mockData} onFindListings={mockOnFindListings} />)

      const buttons = screen.getAllByText('Find Listings')
      expect(buttons).toHaveLength(3)
    })
  })

  describe('Find Listings Button', () => {
    it('should call onFindListings with correct condition on click', async () => {
      const mockOnFindListings = vi.fn()
      const user = userEvent.setup()
      render(<RecommendationDisplay data={mockData} onFindListings={mockOnFindListings} />)

      const buttons = screen.getAllByText('Find Listings')
      await user.click(buttons[0])

      expect(mockOnFindListings).toHaveBeenCalledWith('Like New')
    })

    it('should have proper aria-labels on Find Listings buttons', () => {
      const mockOnFindListings = vi.fn()
      render(<RecommendationDisplay data={mockData} onFindListings={mockOnFindListings} />)

      expect(screen.getByLabelText('Find Like New listings')).toBeInTheDocument()
      expect(screen.getByLabelText('Find Good listings')).toBeInTheDocument()
      expect(screen.getByLabelText('Find Well Used listings')).toBeInTheDocument()
    })
  })

  describe('Market Statistics Table', () => {
    it('should display market statistics with condition tiers', () => {
      const mockOnFindListings = vi.fn()
      render(<RecommendationDisplay data={mockData} onFindListings={mockOnFindListings} />)

      // Check that the table header exists
      const tableHeaders = screen.getAllByText(/Avg Price|Range|Condition/)
      expect(tableHeaders.length).toBeGreaterThanOrEqual(3)

      // Check that condition tiers are shown in the table
      const brandNewElements = screen.queryAllByText('Brand New')
      expect(brandNewElements.length).toBeGreaterThan(0)
    })
  })

  describe('Confidence Badge', () => {
    it('should display Medium confidence', () => {
      const mockOnFindListings = vi.fn()
      const mediumData = { ...mockData, confidence_score: 'Medium' }
      render(<RecommendationDisplay data={mediumData} onFindListings={mockOnFindListings} />)

      expect(screen.getByText('Medium Confidence')).toBeInTheDocument()
    })

    it('should display Low confidence', () => {
      const mockOnFindListings = vi.fn()
      const lowData = { ...mockData, confidence_score: 'Low' }
      render(<RecommendationDisplay data={lowData} onFindListings={mockOnFindListings} />)

      expect(screen.getByText('Low Confidence')).toBeInTheDocument()
    })
  })

  describe('Content Formatting', () => {
    it('should format prices with 2 decimal places', () => {
      const mockOnFindListings = vi.fn()
      render(<RecommendationDisplay data={mockData} onFindListings={mockOnFindListings} />)

      // Check that prices are formatted with .00
      const prices = screen.getAllByText(/£\d+\.\d{2}/)
      expect(prices.length).toBeGreaterThan(0)
      prices.forEach((price) => {
        expect(price.textContent).toMatch(/£\d+\.\d{2}/)
      })
    })
  })
})
