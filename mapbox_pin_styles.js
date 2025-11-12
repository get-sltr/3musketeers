// 🎯 5 MAP PIN STYLES FOR SLTR
// Copy the style you like into your MapViewSimple.tsx or map component

// ============================================
// STYLE 1: Glowing Cyan Circle - Soft halo glow, clean look
// ============================================
const PIN_STYLE_1_GLOWING_CYAN = {
  createMarkerElement: (user) => {
    const el = document.createElement('div')
    el.className = 'custom-marker'
    el.style.cssText = `
      width: 40px;
      height: 40px;
      border-radius: 50%;
      background: radial-gradient(circle, rgba(0, 217, 255, 1) 0%, rgba(0, 217, 255, 0.6) 70%, transparent 100%);
      box-shadow:
        0 0 20px rgba(0, 217, 255, 0.8),
        0 0 40px rgba(0, 217, 255, 0.4),
        inset 0 0 10px rgba(255, 255, 255, 0.3);
      cursor: pointer;
      transition: all 0.3s ease;
      border: 2px solid rgba(0, 217, 255, 0.9);
    `

    // Add profile image if available
    if (user.profile_photo_url) {
      el.innerHTML = `
        <img
          src="${user.profile_photo_url}"
          style="
            width: 100%;
            height: 100%;
            border-radius: 50%;
            object-fit: cover;
            opacity: 0.9;
          "
        />
      `
    }

    // Hover effect
    el.addEventListener('mouseenter', () => {
      el.style.transform = 'scale(1.2)'
      el.style.boxShadow = '0 0 30px rgba(0, 217, 255, 1), 0 0 60px rgba(0, 217, 255, 0.6)'
    })
    el.addEventListener('mouseleave', () => {
      el.style.transform = 'scale(1)'
      el.style.boxShadow = '0 0 20px rgba(0, 217, 255, 0.8), 0 0 40px rgba(0, 217, 255, 0.4)'
    })

    return el
  }
}

// ============================================
// STYLE 2: Magenta Diamond - Sharp, geometric, modern
// ============================================
const PIN_STYLE_2_MAGENTA_DIAMOND = {
  createMarkerElement: (user) => {
    const el = document.createElement('div')
    el.className = 'custom-marker'
    el.style.cssText = `
      width: 40px;
      height: 40px;
      transform: rotate(45deg);
      background: linear-gradient(135deg, rgba(255, 0, 255, 1) 0%, rgba(236, 72, 153, 1) 100%);
      box-shadow:
        0 0 20px rgba(255, 0, 255, 0.8),
        0 4px 8px rgba(0, 0, 0, 0.3);
      cursor: pointer;
      transition: all 0.3s ease;
      border: 2px solid rgba(255, 255, 255, 0.3);
      position: relative;
    `

    // Inner container for image (counter-rotate to keep image upright)
    if (user.profile_photo_url) {
      const innerDiv = document.createElement('div')
      innerDiv.style.cssText = `
        transform: rotate(-45deg);
        width: 100%;
        height: 100%;
        display: flex;
        align-items: center;
        justify-content: center;
        overflow: hidden;
        border-radius: 4px;
      `
      innerDiv.innerHTML = `
        <img
          src="${user.profile_photo_url}"
          style="
            width: 100%;
            height: 100%;
            object-fit: cover;
            opacity: 0.9;
          "
        />
      `
      el.appendChild(innerDiv)
    }

    // Hover effect
    el.addEventListener('mouseenter', () => {
      el.style.transform = 'rotate(45deg) scale(1.2)'
      el.style.boxShadow = '0 0 30px rgba(255, 0, 255, 1), 0 6px 12px rgba(0, 0, 0, 0.4)'
    })
    el.addEventListener('mouseleave', () => {
      el.style.transform = 'rotate(45deg) scale(1)'
      el.style.boxShadow = '0 0 20px rgba(255, 0, 255, 0.8), 0 4px 8px rgba(0, 0, 0, 0.3)'
    })

    return el
  }
}

// ============================================
// STYLE 3: Gradient Pulse - Cyan→Magenta gradient, bold
// ============================================
const PIN_STYLE_3_GRADIENT_PULSE = {
  createMarkerElement: (user) => {
    const el = document.createElement('div')
    el.className = 'custom-marker'
    el.style.cssText = `
      width: 50px;
      height: 50px;
      border-radius: 50%;
      background: linear-gradient(135deg, #00d9ff 0%, #ff00ff 100%);
      box-shadow:
        0 0 0 0 rgba(0, 217, 255, 0.7),
        0 4px 8px rgba(0, 0, 0, 0.3);
      cursor: pointer;
      transition: all 0.3s ease;
      border: 3px solid rgba(255, 255, 255, 0.5);
      position: relative;
      animation: pulse 2s infinite;
    `

    // Add CSS animation
    const style = document.createElement('style')
    style.textContent = `
      @keyframes pulse {
        0% {
          box-shadow: 0 0 0 0 rgba(0, 217, 255, 0.7), 0 4px 8px rgba(0, 0, 0, 0.3);
        }
        50% {
          box-shadow: 0 0 0 15px rgba(0, 217, 255, 0), 0 4px 8px rgba(0, 0, 0, 0.3);
        }
        100% {
          box-shadow: 0 0 0 0 rgba(0, 217, 255, 0), 0 4px 8px rgba(0, 0, 0, 0.3);
        }
      }
    `
    document.head.appendChild(style)

    // Add profile image
    if (user.profile_photo_url) {
      el.innerHTML = `
        <img
          src="${user.profile_photo_url}"
          style="
            width: 100%;
            height: 100%;
            border-radius: 50%;
            object-fit: cover;
            opacity: 0.85;
          "
        />
      `
    }

    // Hover effect
    el.addEventListener('mouseenter', () => {
      el.style.transform = 'scale(1.3)'
      el.style.animationPlayState = 'paused'
    })
    el.addEventListener('mouseleave', () => {
      el.style.transform = 'scale(1)'
      el.style.animationPlayState = 'running'
    })

    return el
  }
}

// ============================================
// STYLE 4: Minimal Square - Clean lines, modern tech feel
// ============================================
const PIN_STYLE_4_MINIMAL_SQUARE = {
  createMarkerElement: (user) => {
    const el = document.createElement('div')
    el.className = 'custom-marker'
    el.style.cssText = `
      width: 44px;
      height: 44px;
      border-radius: 8px;
      background: rgba(10, 10, 15, 0.95);
      box-shadow:
        0 0 0 2px rgba(0, 217, 255, 1),
        0 0 20px rgba(0, 217, 255, 0.5),
        0 4px 12px rgba(0, 0, 0, 0.5);
      cursor: pointer;
      transition: all 0.3s ease;
      position: relative;
      overflow: hidden;
    `

    // Add corner accent
    const accent = document.createElement('div')
    accent.style.cssText = `
      position: absolute;
      top: 0;
      right: 0;
      width: 8px;
      height: 8px;
      background: linear-gradient(135deg, #00d9ff 0%, #ff00ff 100%);
      border-bottom-left-radius: 4px;
    `
    el.appendChild(accent)

    // Add profile image
    if (user.profile_photo_url) {
      const img = document.createElement('img')
      img.src = user.profile_photo_url
      img.style.cssText = `
        width: 100%;
        height: 100%;
        object-fit: cover;
        opacity: 0.9;
      `
      el.appendChild(img)
    }

    // Hover effect
    el.addEventListener('mouseenter', () => {
      el.style.transform = 'scale(1.15) translateY(-4px)'
      el.style.boxShadow = '0 0 0 3px rgba(0, 217, 255, 1), 0 0 30px rgba(0, 217, 255, 0.8), 0 8px 16px rgba(0, 0, 0, 0.6)'
    })
    el.addEventListener('mouseleave', () => {
      el.style.transform = 'scale(1) translateY(0)'
      el.style.boxShadow = '0 0 0 2px rgba(0, 217, 255, 1), 0 0 20px rgba(0, 217, 255, 0.5), 0 4px 12px rgba(0, 0, 0, 0.5)'
    })

    return el
  }
}

// ============================================
// STYLE 5: Neon Triangle - Retro vibe, pointing up
// ============================================
const PIN_STYLE_5_NEON_TRIANGLE = {
  createMarkerElement: (user) => {
    const el = document.createElement('div')
    el.className = 'custom-marker'
    el.style.cssText = `
      width: 0;
      height: 0;
      border-left: 25px solid transparent;
      border-right: 25px solid transparent;
      border-bottom: 40px solid rgba(0, 217, 255, 1);
      cursor: pointer;
      transition: all 0.3s ease;
      filter: drop-shadow(0 0 15px rgba(0, 217, 255, 0.9)) drop-shadow(0 4px 8px rgba(0, 0, 0, 0.4));
      position: relative;
    `

    // Add inner gradient triangle for depth
    const inner = document.createElement('div')
    inner.style.cssText = `
      position: absolute;
      width: 0;
      height: 0;
      border-left: 20px solid transparent;
      border-right: 20px solid transparent;
      border-bottom: 32px solid rgba(255, 0, 255, 0.5);
      top: 4px;
      left: -20px;
    `
    el.appendChild(inner)

    // Add small circle with profile image at the center
    if (user.profile_photo_url) {
      const circle = document.createElement('div')
      circle.style.cssText = `
        position: absolute;
        width: 30px;
        height: 30px;
        border-radius: 50%;
        top: 8px;
        left: -15px;
        overflow: hidden;
        border: 2px solid rgba(255, 255, 255, 0.8);
      `
      circle.innerHTML = `
        <img
          src="${user.profile_photo_url}"
          style="
            width: 100%;
            height: 100%;
            object-fit: cover;
          "
        />
      `
      el.appendChild(circle)
    }

    // Hover effect
    el.addEventListener('mouseenter', () => {
      el.style.transform = 'scale(1.2) translateY(-5px)'
      el.style.filter = 'drop-shadow(0 0 25px rgba(0, 217, 255, 1)) drop-shadow(0 6px 12px rgba(0, 0, 0, 0.5))'
    })
    el.addEventListener('mouseleave', () => {
      el.style.transform = 'scale(1) translateY(0)'
      el.style.filter = 'drop-shadow(0 0 15px rgba(0, 217, 255, 0.9)) drop-shadow(0 4px 8px rgba(0, 0, 0, 0.4))'
    })

    return el
  }
}

// ============================================
// HOW TO USE IN MapViewSimple.tsx
// ============================================
/*

1. Choose which pin style you want (1-5)

2. Replace the marker creation code in MapViewSimple.tsx with:

// Example using Style 1:
nearbyUsers.forEach((user) => {
  if (user.latitude && user.longitude) {
    const el = PIN_STYLE_1_GLOWING_CYAN.createMarkerElement(user)

    // Add click handler
    el.addEventListener('click', () => {
      router.push(`/profile/${user.id}`)
    })

    // Create marker
    new mapboxgl.Marker(el)
      .setLngLat([user.longitude, user.latitude])
      .addTo(map)
  }
})

3. Test it locally and see which style you like best!

*/

// Export all styles
export {
  PIN_STYLE_1_GLOWING_CYAN,
  PIN_STYLE_2_MAGENTA_DIAMOND,
  PIN_STYLE_3_GRADIENT_PULSE,
  PIN_STYLE_4_MINIMAL_SQUARE,
  PIN_STYLE_5_NEON_TRIANGLE
}
