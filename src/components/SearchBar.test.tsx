import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { SearchBar } from './SearchBar'

describe('SearchBar Component', () => {
  describe('Rendering', () => {
    it('should render input and button', () => {
      const mockOnSearch = vi.fn()
      render(<SearchBar onSearch={mockOnSearch} isLoading={false} />)

      expect(screen.getByRole('textbox')).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /get recommendation/i })).toBeInTheDocument()
    })

    it('should display custom placeholder when provided', () => {
      const mockOnSearch = vi.fn()
      const customPlaceholder = 'Search for products...'
      render(
        <SearchBar
          onSearch={mockOnSearch}
          isLoading={false}
          placeholder={customPlaceholder}
        />
      )

      expect(screen.getByPlaceholderText(customPlaceholder)).toBeInTheDocument()
    })

    it('should use default placeholder when not provided', () => {
      const mockOnSearch = vi.fn()
      render(<SearchBar onSearch={mockOnSearch} isLoading={false} />)

      expect(
        screen.getByPlaceholderText("Search product (e.g., 'Logitech G Pro X')")
      ).toBeInTheDocument()
    })
  })

  describe('Validation', () => {
    it('should disable button when query is empty', async () => {
      const mockOnSearch = vi.fn()
      render(<SearchBar onSearch={mockOnSearch} isLoading={false} />)

      const button = screen.getByRole('button', { name: /get recommendation/i })
      expect(button).toBeDisabled()
    })

    it('should disable button when query is less than 2 characters', async () => {
      const mockOnSearch = vi.fn()
      const user = userEvent.setup()
      render(<SearchBar onSearch={mockOnSearch} isLoading={false} />)

      const input = screen.getByRole('textbox')
      await user.type(input, 'a')

      const button = screen.getByRole('button', { name: /get recommendation/i })
      expect(button).toBeDisabled()
    })

    it('should enable button when query is 2 characters or more', async () => {
      const mockOnSearch = vi.fn()
      const user = userEvent.setup()
      render(<SearchBar onSearch={mockOnSearch} isLoading={false} />)

      const input = screen.getByRole('textbox')
      await user.type(input, 'ab')

      const button = screen.getByRole('button', { name: /get recommendation/i })
      expect(button).not.toBeDisabled()
    })

    it('should disable button when query exceeds 100 characters', async () => {
      const mockOnSearch = vi.fn()
      const user = userEvent.setup()
      render(<SearchBar onSearch={mockOnSearch} isLoading={false} />)

      const input = screen.getByRole('textbox')
      const longQuery = 'a'.repeat(101)
      await user.type(input, longQuery)

      const button = screen.getByRole('button', { name: /get recommendation/i })
      expect(button).toBeDisabled()
    })

    it('should enable button when query is exactly 100 characters', async () => {
      const mockOnSearch = vi.fn()
      const user = userEvent.setup()
      render(<SearchBar onSearch={mockOnSearch} isLoading={false} />)

      const input = screen.getByRole('textbox')
      const maxQuery = 'a'.repeat(100)
      await user.type(input, maxQuery)

      const button = screen.getByRole('button', { name: /get recommendation/i })
      expect(button).not.toBeDisabled()
    })
  })

  describe('Form Submission', () => {
    it('should call onSearch with trimmed query on submit', async () => {
      const mockOnSearch = vi.fn()
      const user = userEvent.setup()
      render(<SearchBar onSearch={mockOnSearch} isLoading={false} />)

      const input = screen.getByRole('textbox')
      await user.type(input, '  Logitech Mouse  ')
      const button = screen.getByRole('button', { name: /get recommendation/i })
      await user.click(button)

      expect(mockOnSearch).toHaveBeenCalledWith('Logitech Mouse')
      expect(mockOnSearch).toHaveBeenCalledTimes(1)
    })

    it('should clear input after successful submit', async () => {
      const mockOnSearch = vi.fn()
      const user = userEvent.setup()
      render(<SearchBar onSearch={mockOnSearch} isLoading={false} />)

      const input = screen.getByRole('textbox') as HTMLInputElement
      await user.type(input, 'keyboard')
      const button = screen.getByRole('button', { name: /get recommendation/i })
      await user.click(button)

      expect(input.value).toBe('')
    })

    it('should not call onSearch when query is invalid', async () => {
      const mockOnSearch = vi.fn()
      const user = userEvent.setup()
      render(<SearchBar onSearch={mockOnSearch} isLoading={false} />)

      const input = screen.getByRole('textbox')

      // Try to submit with empty input
      await user.type(input, 'a')
      await user.click(screen.getByRole('button', { name: /get recommendation/i }))

      expect(mockOnSearch).not.toHaveBeenCalled()
    })

    it('should support keyboard submission (Enter key)', async () => {
      const mockOnSearch = vi.fn()
      const user = userEvent.setup()
      render(<SearchBar onSearch={mockOnSearch} isLoading={false} />)

      const input = screen.getByRole('textbox')
      await user.type(input, 'mouse{Enter}')

      expect(mockOnSearch).toHaveBeenCalledWith('mouse')
      expect(mockOnSearch).toHaveBeenCalledTimes(1)
    })
  })

  describe('Loading State', () => {
    it('should disable input when isLoading is true', () => {
      const mockOnSearch = vi.fn()
      render(<SearchBar onSearch={mockOnSearch} isLoading={true} />)

      const input = screen.getByRole('textbox') as HTMLInputElement
      expect(input.disabled).toBe(true)
    })

    it('should disable button when isLoading is true', () => {
      const mockOnSearch = vi.fn()
      render(<SearchBar onSearch={mockOnSearch} isLoading={true} />)

      const button = screen.getByRole('button')
      expect(button).toBeDisabled()
    })

    it('should show "Searching..." text when isLoading is true', () => {
      const mockOnSearch = vi.fn()
      render(<SearchBar onSearch={mockOnSearch} isLoading={true} />)

      const button = screen.getByRole('button')
      expect(button).toHaveTextContent('Searching...')
    })

    it('should show "Search" text when isLoading is false', () => {
      const mockOnSearch = vi.fn()
      render(<SearchBar onSearch={mockOnSearch} isLoading={false} />)

      const button = screen.getByRole('button')
      expect(button).toHaveTextContent('Search')
    })

    it('should not prevent input when isLoading is false', () => {
      const mockOnSearch = vi.fn()
      render(<SearchBar onSearch={mockOnSearch} isLoading={false} />)

      const input = screen.getByRole('textbox') as HTMLInputElement
      expect(input.disabled).toBe(false)
    })
  })

  describe('Accessibility', () => {
    it('should have proper aria-label on input', () => {
      const mockOnSearch = vi.fn()
      render(<SearchBar onSearch={mockOnSearch} isLoading={false} />)

      const input = screen.getByRole('textbox')
      expect(input).toHaveAttribute('aria-label', 'Product search')
    })

    it('should have proper aria-label on button', () => {
      const mockOnSearch = vi.fn()
      render(<SearchBar onSearch={mockOnSearch} isLoading={false} />)

      const button = screen.getByRole('button')
      expect(button).toHaveAttribute('aria-label', 'Get recommendation')
    })
  })

  describe('Edge Cases', () => {
    it('should handle whitespace-only queries as invalid', async () => {
      const mockOnSearch = vi.fn()
      const user = userEvent.setup()
      render(<SearchBar onSearch={mockOnSearch} isLoading={false} />)

      const input = screen.getByRole('textbox')
      await user.type(input, '   ')

      const button = screen.getByRole('button', { name: /get recommendation/i })
      expect(button).toBeDisabled()
    })

    it('should trim whitespace from both ends before validation', async () => {
      const mockOnSearch = vi.fn()
      const user = userEvent.setup()
      render(<SearchBar onSearch={mockOnSearch} isLoading={false} />)

      const input = screen.getByRole('textbox')
      await user.type(input, '    valid query    ')

      const button = screen.getByRole('button', { name: /get recommendation/i })
      expect(button).not.toBeDisabled()
    })

    it('should handle special characters in query', async () => {
      const mockOnSearch = vi.fn()
      const user = userEvent.setup()
      render(<SearchBar onSearch={mockOnSearch} isLoading={false} />)

      const input = screen.getByRole('textbox')
      await user.type(input, 'USB-C 3.0/3.1 (Pro Max)')

      const button = screen.getByRole('button', { name: /get recommendation/i })
      expect(button).not.toBeDisabled()

      await user.click(button)
      expect(mockOnSearch).toHaveBeenCalledWith('USB-C 3.0/3.1 (Pro Max)')
    })
  })
})
