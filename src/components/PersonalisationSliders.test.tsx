import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { PersonalisationSliders } from './PersonalisationSliders'
import type { Preferences } from '@/lib/types'

const mockPreferences: Preferences = {
  budget_flexibility: 5,
  condition_standards: 5,
  hassle_tolerance: 5,
}

describe('PersonalisationSliders Component', () => {
  describe('Rendering', () => {
    it('should render all three sliders', () => {
      const mockOnChange = vi.fn()
      render(
        <PersonalisationSliders
          preferences={mockPreferences}
          onPreferencesChange={mockOnChange}
        />
      )

      expect(screen.getByLabelText('Budget Flexibility')).toBeInTheDocument()
      expect(screen.getByLabelText('Condition Standards')).toBeInTheDocument()
      expect(screen.getByLabelText('Hassle Tolerance')).toBeInTheDocument()
    })

    it('should display descriptions for all sliders', () => {
      const mockOnChange = vi.fn()
      render(
        <PersonalisationSliders
          preferences={mockPreferences}
          onPreferencesChange={mockOnChange}
        />
      )

      expect(screen.getByText('0 = tight budget, 10 = very flexible')).toBeInTheDocument()
      expect(screen.getByText('0 = any condition, 10 = pristine only')).toBeInTheDocument()
      expect(screen.getByText('0 = willing to fix, 10 = must work immediately')).toBeInTheDocument()
    })

    it('should display current values for all sliders', () => {
      const mockOnChange = vi.fn()
      render(
        <PersonalisationSliders
          preferences={mockPreferences}
          onPreferencesChange={mockOnChange}
        />
      )

      const values = screen.getAllByText(/\/10/)
      expect(values).toHaveLength(3)
      values.forEach((val) => {
        expect(val).toHaveTextContent('5/10')
      })
    })
  })

  describe('Emoji Display', () => {
    it('should display correct emoji for budget flexibility levels', () => {
      const mockOnChange = vi.fn()

      const { rerender } = render(
        <PersonalisationSliders
          preferences={{ ...mockPreferences, budget_flexibility: 2 }}
          onPreferencesChange={mockOnChange}
        />
      )
      expect(screen.getAllByText('💸')[0]).toBeInTheDocument()

      rerender(
        <PersonalisationSliders
          preferences={{ ...mockPreferences, budget_flexibility: 5 }}
          onPreferencesChange={mockOnChange}
        />
      )
      expect(screen.getAllByText('💰')[0]).toBeInTheDocument()

      rerender(
        <PersonalisationSliders
          preferences={{ ...mockPreferences, budget_flexibility: 8 }}
          onPreferencesChange={mockOnChange}
        />
      )
      expect(screen.getAllByText('🤑')[0]).toBeInTheDocument()
    })

    it('should display correct emoji for condition standards levels', () => {
      const mockOnChange = vi.fn()

      const { rerender } = render(
        <PersonalisationSliders
          preferences={{ ...mockPreferences, condition_standards: 2 }}
          onPreferencesChange={mockOnChange}
        />
      )
      expect(screen.getAllByText('🔧')[0]).toBeInTheDocument()

      rerender(
        <PersonalisationSliders
          preferences={{ ...mockPreferences, condition_standards: 5 }}
          onPreferencesChange={mockOnChange}
        />
      )
      expect(screen.getAllByText('⭐')[0]).toBeInTheDocument()

      rerender(
        <PersonalisationSliders
          preferences={{ ...mockPreferences, condition_standards: 8 }}
          onPreferencesChange={mockOnChange}
        />
      )
      expect(screen.getAllByText('✨')[0]).toBeInTheDocument()
    })

    it('should display correct emoji for hassle tolerance levels', () => {
      const mockOnChange = vi.fn()

      const { rerender } = render(
        <PersonalisationSliders
          preferences={{ ...mockPreferences, hassle_tolerance: 2 }}
          onPreferencesChange={mockOnChange}
        />
      )
      expect(screen.getAllByText('🛠️')[0]).toBeInTheDocument()

      rerender(
        <PersonalisationSliders
          preferences={{ ...mockPreferences, hassle_tolerance: 5 }}
          onPreferencesChange={mockOnChange}
        />
      )
      expect(screen.getAllByText('⚡')[0]).toBeInTheDocument()

      rerender(
        <PersonalisationSliders
          preferences={{ ...mockPreferences, hassle_tolerance: 8 }}
          onPreferencesChange={mockOnChange}
        />
      )
      expect(screen.getAllByText('🎯')[0]).toBeInTheDocument()
    })
  })

  describe('Slider Interaction', () => {
    it('should call onPreferencesChange when slider value changes', () => {
      const mockOnChange = vi.fn()

      render(
        <PersonalisationSliders
          preferences={mockPreferences}
          onPreferencesChange={mockOnChange}
        />
      )

      const sliders = screen.getAllByRole('slider')
      expect(sliders).toHaveLength(3)
      expect(sliders[0]).toHaveAttribute('aria-valuenow', '5')
    })

    it('should display all sliders with 0-10 range', () => {
      const mockOnChange = vi.fn()

      render(
        <PersonalisationSliders
          preferences={mockPreferences}
          onPreferencesChange={mockOnChange}
        />
      )

      const sliders = screen.getAllByRole('slider')
      sliders.forEach((slider) => {
        expect(slider).toHaveAttribute('aria-valuemin', '0')
        expect(slider).toHaveAttribute('aria-valuemax', '10')
      })
    })

    it('should have correct aria-valuenow for current values', () => {
      const mockOnChange = vi.fn()
      const testPrefs: Preferences = {
        budget_flexibility: 3,
        condition_standards: 7,
        hassle_tolerance: 5,
      }

      render(
        <PersonalisationSliders preferences={testPrefs} onPreferencesChange={mockOnChange} />
      )

      const sliders = screen.getAllByRole('slider')
      expect(sliders[0]).toHaveAttribute('aria-valuenow', '3')
      expect(sliders[1]).toHaveAttribute('aria-valuenow', '7')
      expect(sliders[2]).toHaveAttribute('aria-valuenow', '5')
    })
  })

  describe('Low/High Labels', () => {
    it('should display Low and High labels', () => {
      const mockOnChange = vi.fn()
      render(
        <PersonalisationSliders
          preferences={mockPreferences}
          onPreferencesChange={mockOnChange}
        />
      )

      const lowLabels = screen.getAllByText('Low')
      const highLabels = screen.getAllByText('High')

      expect(lowLabels).toHaveLength(3)
      expect(highLabels).toHaveLength(3)
    })
  })

  describe('Slider Attributes', () => {
    it('should have correct min, max, and step attributes', () => {
      const mockOnChange = vi.fn()
      render(
        <PersonalisationSliders
          preferences={mockPreferences}
          onPreferencesChange={mockOnChange}
        />
      )

      const sliders = screen.getAllByRole('slider')
      sliders.forEach((slider) => {
        expect(slider).toHaveAttribute('aria-valuemin', '0')
        expect(slider).toHaveAttribute('aria-valuemax', '10')
      })
    })

    it('should have proper aria-labels for accessibility', () => {
      const mockOnChange = vi.fn()
      render(
        <PersonalisationSliders
          preferences={mockPreferences}
          onPreferencesChange={mockOnChange}
        />
      )

      expect(screen.getByLabelText('Budget Flexibility')).toBeInTheDocument()
      expect(screen.getByLabelText('Condition Standards')).toBeInTheDocument()
      expect(screen.getByLabelText('Hassle Tolerance')).toBeInTheDocument()
    })
  })

  describe('Value Updates', () => {
    it('should update values when preferences prop changes', () => {
      const mockOnChange = vi.fn()
      const { rerender } = render(
        <PersonalisationSliders preferences={mockPreferences} onPreferencesChange={mockOnChange} />
      )

      let values = screen.getAllByText(/\/10/)
      values.forEach((val) => {
        expect(val).toHaveTextContent('5/10')
      })

      const updatedPreferences = {
        ...mockPreferences,
        budget_flexibility: 9,
        condition_standards: 3,
        hassle_tolerance: 7,
      }

      rerender(
        <PersonalisationSliders
          preferences={updatedPreferences}
          onPreferencesChange={mockOnChange}
        />
      )

      values = screen.getAllByText(/\/10/)
      // Values should be updated
      const textsWithSlash = values.map((v) => v.textContent)
      expect(textsWithSlash).toContain('9/10')
      expect(textsWithSlash).toContain('3/10')
      expect(textsWithSlash).toContain('7/10')
    })
  })
})
