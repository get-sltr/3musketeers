interface VenueMarkerProps {
  name: string
  type: 'bar' | 'club' | 'sauna' | 'restaurant'
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
    }
  }

  const getColor = () => {
    switch (type) {
      case 'bar':
        return 'rgba(255, 0, 255, 0.9)' // Magenta
      case 'club':
        return 'rgba(147, 51, 234, 0.9)' // Purple
      case 'sauna':
        return 'rgba(0, 212, 255, 0.9)' // Cyan
      case 'restaurant':
        return 'rgba(255, 105, 180, 0.9)' // Pink
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
        background: getColor(),
        border: '3px solid rgba(255, 255, 255, 0.9)',
        boxShadow: '0 4px 16px rgba(0, 0, 0, 0.4), 0 0 20px rgba(255, 0, 255, 0.5)',
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
  type: 'bar' | 'club' | 'sauna' | 'restaurant',
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
    }
  }

  const getColor = () => {
    switch (type) {
      case 'bar': return 'rgba(255, 0, 255, 0.9)'
      case 'club': return 'rgba(147, 51, 234, 0.9)'
      case 'sauna': return 'rgba(0, 212, 255, 0.9)'
      case 'restaurant': return 'rgba(255, 105, 180, 0.9)'
    }
  }

  el.style.background = getColor()
  el.textContent = getIcon()

  el.addEventListener('mouseenter', () => {
    el.style.transform = 'scale(1.2)'
  })
  el.addEventListener('mouseleave', () => {
    el.style.transform = 'scale(1)'
  })

  el.addEventListener('click', onClick)

  return el
}
