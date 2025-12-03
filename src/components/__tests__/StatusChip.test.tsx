/**
 * Snapshot tests for StatusChip component
 */
import { render } from '@testing-library/react'
import StatusChip from '../ui/StatusChip'

describe('StatusChip', () => {
  describe('snapshots', () => {
    it('renders default variant correctly', () => {
      const { container } = render(<StatusChip label="Default" />)
      expect(container.firstChild).toMatchSnapshot()
    })

    it('renders online variant correctly', () => {
      const { container } = render(<StatusChip label="Online" variant="online" />)
      expect(container.firstChild).toMatchSnapshot()
    })

    it('renders offline variant correctly', () => {
      const { container } = render(<StatusChip label="Offline" variant="offline" />)
      expect(container.firstChild).toMatchSnapshot()
    })

    it('renders away variant correctly', () => {
      const { container } = render(<StatusChip label="Away" variant="away" />)
      expect(container.firstChild).toMatchSnapshot()
    })

    it('renders self variant correctly', () => {
      const { container } = render(<StatusChip label="You" variant="self" />)
      expect(container.firstChild).toMatchSnapshot()
    })

    it('renders party variant correctly', () => {
      const { container } = render(<StatusChip label="Party" variant="party" />)
      expect(container.firstChild).toMatchSnapshot()
    })

    it('renders dtfn variant correctly', () => {
      const { container } = render(<StatusChip label="Ready Now" variant="dtfn" />)
      expect(container.firstChild).toMatchSnapshot()
    })

    it('renders tag variant correctly', () => {
      const { container } = render(<StatusChip label="Tech" variant="tag" />)
      expect(container.firstChild).toMatchSnapshot()
    })

    it('renders medium size correctly', () => {
      const { container } = render(<StatusChip label="Medium" size="md" />)
      expect(container.firstChild).toMatchSnapshot()
    })
  })

  describe('behavior', () => {
    it('displays the correct label text', () => {
      const { getByText } = render(<StatusChip label="Test Label" />)
      expect(getByText('Test Label')).toBeInTheDocument()
    })

    it('applies correct base styles', () => {
      const { container } = render(<StatusChip label="Test" />)
      const chip = container.firstChild as HTMLElement
      expect(chip).toHaveClass('inline-flex')
      expect(chip).toHaveClass('rounded-full')
      expect(chip).toHaveClass('font-medium')
    })

    it('applies small size styles by default', () => {
      const { container } = render(<StatusChip label="Test" />)
      const chip = container.firstChild as HTMLElement
      expect(chip).toHaveClass('px-2')
      expect(chip).toHaveClass('py-0.5')
      expect(chip).toHaveClass('text-xs')
    })

    it('applies medium size styles when specified', () => {
      const { container } = render(<StatusChip label="Test" size="md" />)
      const chip = container.firstChild as HTMLElement
      expect(chip).toHaveClass('px-3')
      expect(chip).toHaveClass('py-1')
      expect(chip).toHaveClass('text-sm')
    })
  })
})
