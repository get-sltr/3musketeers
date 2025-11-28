type VenueType = 'bar' | 'club' | 'sauna' | 'restaurant' | 'lgbtq'

interface VenueMarkerProps {
  name: string
  type: VenueType
  address: string
  onClick: () => void
}

export function VenueMarker({ name, type, address, onClick }: VenueMarkerProps) {
  const getIcon = () => {
    switch (type) {
      case 'bar':
        return '🍸'
      case 'club':
        return '💃'
      case 'sauna':
        return '🛁'
      case 'restaurant':
        return '🍽️'
      case 'lgbtq':
        return '🏳️‍🌈'
      default:
        return '📍'
    }
  }

  const getAccent = () => {
    switch (type) {
      case 'bar':
        return 'rgba(200, 210, 255, 0.65)'
      case 'club':
        return 'rgba(180, 205, 255, 0.65)'
      case 'sauna':
        return 'rgba(155, 210, 235, 0.65)'
      case 'restaurant':
        return 'rgba(240, 215, 255, 0.65)'
      case 'lgbtq':
        return 'rgba(255, 180, 220, 0.65)'
      default:
        return 'rgba(200, 200, 200, 0.65)'
    }
  }

  return (
    <div
      onClick={onClick}
      className="venue-marker"
      style={{
        width: '40px',
        height: '40px',
        borderRadius: '50%',
        background: `radial-gradient(circle at 30% 30%, rgba(255,255,255,0.92), ${getAccent()})`,
        border: '2px solid rgba(255, 255, 255, 0.65)',
        boxShadow: '0 6px 24px rgba(5, 10, 20, 0.45), 0 0 18px rgba(220, 235, 255, 0.45)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: '20px',
        cursor: 'pointer',
        transition: 'transform 0.2s',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = 'scale(1.2)'
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = 'scale(1)'
      }}
      title={name}
    >
      {getIcon()}
    </div>
  )
}

export function createVenueMarker(
  name: string,
  type: VenueType | string,
  address: string,
  onClick: () => void
) {
  const el = document.createElement('div')
  el.style.width = '40px'
  el.style.height = '40px'
  el.style.borderRadius = '50%'
  el.style.border = '3px solid rgba(255, 255, 255, 0.9)'
  el.style.boxShadow = '0 4px 16px rgba(0, 0, 0, 0.4), 0 0 20px rgba(255, 0, 255, 0.5)'
  el.style.display = 'flex'
  el.style.alignItems = 'center'
  el.style.justifyContent = 'center'
  el.style.fontSize = '20px'
  el.style.cursor = 'pointer'
  el.title = `${name}\n${address}`

  const getIcon = () => {
    switch (type) {
      case 'bar': return '🍸'
      case 'club': return '💃'
      case 'sauna': return '🛁'
      case 'restaurant': return '🍽️'
      case 'lgbtq': return '🏳️‍🌈'
      default: return '📍'
    }
  }

  const getAccent = () => {
    switch (type) {
      case 'bar': return 'rgba(200, 210, 255, 0.65)'
      case 'club': return 'rgba(180, 205, 255, 0.65)'
      case 'sauna': return 'rgba(155, 210, 235, 0.65)'
      case 'restaurant': return 'rgba(240, 215, 255, 0.65)'
      case 'lgbtq': return 'rgba(255, 180, 220, 0.65)'
      default: return 'rgba(200, 200, 200, 0.65)'
    }
  }

  el.style.background = `radial-gradient(circle at 30% 30%, rgba(255,255,255,0.92), ${getAccent()})`
  el.textContent = getIcon()
  el.style.border = '2px solid rgba(255, 255, 255, 0.65)'
  el.style.boxShadow = '0 6px 24px rgba(5, 10, 20, 0.45), 0 0 18px rgba(220, 235, 255, 0.45)'
  el.style.backdropFilter = 'blur(6px)'

  el.addEventListener('mouseenter', () => {
    el.style.transform = 'scale(1.2)'
  })
  el.addEventListener('mouseleave', () => {
    el.style.transform = 'scale(1)'
  })

  el.addEventListener('click', onClick)

  return el
}
