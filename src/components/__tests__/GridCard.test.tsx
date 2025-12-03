/**
 * Snapshot tests for GridCard component
 */
import { render, screen, fireEvent } from '@testing-library/react'
import GridCard from '../grid/GridCard'
import { UserGridProfile } from '@/lib/types/profile'

// Mock next/image
jest.mock('next/image', () => ({
  __esModule: true,
  default: ({ src, alt, onError, fill, priority, ...props }: any) => {
    // Filter out Next.js-specific props that aren't valid HTML attributes
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={src} alt={alt} {...props} data-testid="grid-card-image" />
  },
}))

// Mock heroicons
jest.mock('@heroicons/react/24/outline', () => ({
  ChatBubbleLeftIcon: () => <svg data-testid="chat-icon" />,
  StarIcon: () => <svg data-testid="star-icon-outline" />,
}))

jest.mock('@heroicons/react/24/solid', () => ({
  StarIcon: () => <svg data-testid="star-icon-solid" />,
}))

// Mock utils
jest.mock('@/lib/utils/profile', () => ({
  DEFAULT_PROFILE_IMAGE: '/default-avatar.png',
  resolveProfilePhoto: (photoUrl: string | null) => photoUrl || '/default-avatar.png',
  formatDistance: (miles: number | null) => (miles ? `${miles.toFixed(1)} mi` : null),
}))

describe('GridCard', () => {
  const mockUser: UserGridProfile = {
    id: 'test-user-123',
    display_name: 'John Doe',
    username: 'johndoe',
    photo_url: 'https://example.com/photo.jpg',
    photos: [],
    age: 25,
    is_online: true,
    dtfn: false,
    party_friendly: false,
    distance_miles: 2.5,
    tags: ['Music', 'Travel'],
  }

  const mockOnOpen = jest.fn()
  const mockOnToggleFavorite = jest.fn()
  const mockOnQuickMessage = jest.fn()

  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('snapshots', () => {
    it('renders basic card correctly', () => {
      const { container } = render(
        <GridCard user={mockUser} onOpen={mockOnOpen} />
      )
      expect(container.firstChild).toMatchSnapshot()
    })

    it('renders card with online status', () => {
      const { container } = render(
        <GridCard user={{ ...mockUser, is_online: true }} onOpen={mockOnOpen} />
      )
      expect(container.firstChild).toMatchSnapshot()
    })

    it('renders card with DTFN badge', () => {
      const { container } = render(
        <GridCard user={{ ...mockUser, dtfn: true }} onOpen={mockOnOpen} />
      )
      expect(container.firstChild).toMatchSnapshot()
    })

    it('renders card with party status', () => {
      const { container } = render(
        <GridCard user={{ ...mockUser, party_friendly: true }} onOpen={mockOnOpen} />
      )
      expect(container.firstChild).toMatchSnapshot()
    })

    it('renders card with all action buttons', () => {
      const { container } = render(
        <GridCard
          user={mockUser}
          onOpen={mockOnOpen}
          onToggleFavorite={mockOnToggleFavorite}
          onQuickMessage={mockOnQuickMessage}
        />
      )
      expect(container.firstChild).toMatchSnapshot()
    })

    it('renders card with favorited state', () => {
      const { container } = render(
        <GridCard
          user={mockUser}
          onOpen={mockOnOpen}
          onToggleFavorite={mockOnToggleFavorite}
          isFavorited={true}
        />
      )
      expect(container.firstChild).toMatchSnapshot()
    })

    it('renders card with tags', () => {
      const userWithTags = { ...mockUser, tags: ['Music', 'Travel', 'Fitness'] }
      const { container } = render(
        <GridCard user={userWithTags} onOpen={mockOnOpen} />
      )
      expect(container.firstChild).toMatchSnapshot()
    })

    it('renders card without distance', () => {
      const userNoDistance = { ...mockUser, distance_miles: null }
      const { container } = render(
        <GridCard user={userNoDistance} onOpen={mockOnOpen} />
      )
      expect(container.firstChild).toMatchSnapshot()
    })
  })

  describe('behavior', () => {
    it('displays user name correctly', () => {
      render(<GridCard user={mockUser} onOpen={mockOnOpen} />)
      expect(screen.getByText('John Doe')).toBeInTheDocument()
    })

    it('displays distance when available', () => {
      render(<GridCard user={mockUser} onOpen={mockOnOpen} />)
      expect(screen.getByText('2.5 mi')).toBeInTheDocument()
    })

    it('calls onOpen when card is clicked', () => {
      render(<GridCard user={mockUser} onOpen={mockOnOpen} />)
      const card = screen.getByRole('button')
      fireEvent.click(card)
      expect(mockOnOpen).toHaveBeenCalledWith(mockUser)
    })

    it('calls onToggleFavorite when favorite button is clicked', () => {
      render(
        <GridCard
          user={mockUser}
          onOpen={mockOnOpen}
          onToggleFavorite={mockOnToggleFavorite}
        />
      )
      const favoriteButton = screen.getByRole('button', {
        name: /add john doe to favorites/i,
      })
      fireEvent.click(favoriteButton)
      expect(mockOnToggleFavorite).toHaveBeenCalledWith(mockUser.id)
      expect(mockOnOpen).not.toHaveBeenCalled() // Should stop propagation
    })

    it('calls onQuickMessage when message button is clicked', () => {
      render(
        <GridCard
          user={mockUser}
          onOpen={mockOnOpen}
          onQuickMessage={mockOnQuickMessage}
        />
      )
      const messageButton = screen.getByRole('button', {
        name: /send message to john doe/i,
      })
      fireEvent.click(messageButton)
      expect(mockOnQuickMessage).toHaveBeenCalledWith(mockUser.id)
      expect(mockOnOpen).not.toHaveBeenCalled() // Should stop propagation
    })

    it('shows online indicator when user is online', () => {
      render(<GridCard user={{ ...mockUser, is_online: true }} onOpen={mockOnOpen} />)
      expect(screen.getByText('Online')).toBeInTheDocument()
    })

    it('shows DTFN badge when user has dtfn status', () => {
      render(<GridCard user={{ ...mockUser, dtfn: true }} onOpen={mockOnOpen} />)
      expect(screen.getByText('DTFN')).toBeInTheDocument()
    })

    it('displays only first 2 tags', () => {
      const userWithManyTags = {
        ...mockUser,
        tags: ['Tag1', 'Tag2', 'Tag3', 'Tag4'],
      }
      render(<GridCard user={userWithManyTags} onOpen={mockOnOpen} />)
      expect(screen.getByText('Tag1')).toBeInTheDocument()
      expect(screen.getByText('Tag2')).toBeInTheDocument()
      expect(screen.queryByText('Tag3')).not.toBeInTheDocument()
      expect(screen.queryByText('Tag4')).not.toBeInTheDocument()
    })

    it('uses fallback name when display_name is not available', () => {
      const userNoName = { ...mockUser, display_name: undefined }
      render(<GridCard user={userNoName} onOpen={mockOnOpen} />)
      expect(screen.getByText('johndoe')).toBeInTheDocument()
    })

    it('uses "Member" when no name is available', () => {
      const userNoName = { ...mockUser, display_name: undefined, username: undefined }
      render(<GridCard user={userNoName} onOpen={mockOnOpen} />)
      expect(screen.getByText('Member')).toBeInTheDocument()
    })
  })

  describe('accessibility', () => {
    it('has proper aria-label for favorite button', () => {
      render(
        <GridCard
          user={mockUser}
          onOpen={mockOnOpen}
          onToggleFavorite={mockOnToggleFavorite}
          isFavorited={false}
        />
      )
      expect(
        screen.getByRole('button', { name: /add john doe to favorites/i })
      ).toBeInTheDocument()
    })

    it('has proper aria-label for remove from favorites button', () => {
      render(
        <GridCard
          user={mockUser}
          onOpen={mockOnOpen}
          onToggleFavorite={mockOnToggleFavorite}
          isFavorited={true}
        />
      )
      expect(
        screen.getByRole('button', { name: /remove john doe from favorites/i })
      ).toBeInTheDocument()
    })

    it('has proper aria-label for message button', () => {
      render(
        <GridCard
          user={mockUser}
          onOpen={mockOnOpen}
          onQuickMessage={mockOnQuickMessage}
        />
      )
      expect(
        screen.getByRole('button', { name: /send message to john doe/i })
      ).toBeInTheDocument()
    })
  })
})
