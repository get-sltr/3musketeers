/**
 * Tests for useFocusTrap hook
 */
import { renderHook, act } from '@testing-library/react'
import { useFocusTrap } from '../useFocusTrap'

describe('useFocusTrap', () => {
  beforeEach(() => {
    // Clear any existing event listeners before each test
    document.body.innerHTML = ''
  })

  describe('return values', () => {
    it('returns containerRef, activate, deactivate, and isActive', () => {
      const { result } = renderHook(() => useFocusTrap())
      
      expect(result.current).toHaveProperty('containerRef')
      expect(result.current).toHaveProperty('activate')
      expect(result.current).toHaveProperty('deactivate')
      expect(result.current).toHaveProperty('isActive')
      expect(typeof result.current.activate).toBe('function')
      expect(typeof result.current.deactivate).toBe('function')
      expect(typeof result.current.isActive).toBe('boolean')
    })

    it('starts with isActive as false', () => {
      const { result } = renderHook(() => useFocusTrap())
      
      expect(result.current.isActive).toBe(false)
    })
  })

  describe('activation', () => {
    it('sets isActive to true when activate is called', () => {
      const { result } = renderHook(() => useFocusTrap())
      
      // Create a container element for the ref
      const container = document.createElement('div')
      document.body.appendChild(container)
      
      // Manually set the ref
      Object.defineProperty(result.current.containerRef, 'current', {
        value: container,
        writable: true,
      })
      
      act(() => {
        result.current.activate()
      })
      
      expect(result.current.isActive).toBe(true)
    })

    it('does not activate when enabled is false', () => {
      const { result } = renderHook(() => useFocusTrap({ enabled: false }))
      
      // Create a container element for the ref
      const container = document.createElement('div')
      document.body.appendChild(container)
      
      // Manually set the ref
      Object.defineProperty(result.current.containerRef, 'current', {
        value: container,
        writable: true,
      })
      
      act(() => {
        result.current.activate()
      })
      
      expect(result.current.isActive).toBe(false)
    })

    it('does not activate when containerRef is null', () => {
      const { result } = renderHook(() => useFocusTrap())
      
      act(() => {
        result.current.activate()
      })
      
      expect(result.current.isActive).toBe(false)
    })
  })

  describe('deactivation', () => {
    it('sets isActive to false when deactivate is called', () => {
      const { result } = renderHook(() => useFocusTrap())
      
      // Create a container element for the ref
      const container = document.createElement('div')
      document.body.appendChild(container)
      
      // Manually set the ref
      Object.defineProperty(result.current.containerRef, 'current', {
        value: container,
        writable: true,
      })
      
      act(() => {
        result.current.activate()
      })
      
      expect(result.current.isActive).toBe(true)
      
      act(() => {
        result.current.deactivate()
      })
      
      expect(result.current.isActive).toBe(false)
    })

    it('does nothing when deactivate is called while not active', () => {
      const { result } = renderHook(() => useFocusTrap())
      
      expect(result.current.isActive).toBe(false)
      
      act(() => {
        result.current.deactivate()
      })
      
      expect(result.current.isActive).toBe(false)
    })
  })

  describe('options', () => {
    it('accepts onEscape callback option', () => {
      const onEscape = jest.fn()
      const { result } = renderHook(() => useFocusTrap({ onEscape }))
      
      expect(result.current).toBeDefined()
    })

    it('accepts onClickOutside callback option', () => {
      const onClickOutside = jest.fn()
      const { result } = renderHook(() => useFocusTrap({ onClickOutside }))
      
      expect(result.current).toBeDefined()
    })

    it('accepts returnFocusOnDeactivate option', () => {
      const { result } = renderHook(() => 
        useFocusTrap({ returnFocusOnDeactivate: false })
      )
      
      expect(result.current).toBeDefined()
    })

    it('accepts allowOutsideClick option', () => {
      const { result } = renderHook(() => 
        useFocusTrap({ allowOutsideClick: true })
      )
      
      expect(result.current).toBeDefined()
    })
  })

  describe('reactive state', () => {
    it('isActive state updates trigger re-renders', () => {
      const { result, rerender } = renderHook(() => useFocusTrap())
      
      // Create a container element for the ref
      const container = document.createElement('div')
      document.body.appendChild(container)
      
      // Manually set the ref
      Object.defineProperty(result.current.containerRef, 'current', {
        value: container,
        writable: true,
      })
      
      const initialIsActive = result.current.isActive
      expect(initialIsActive).toBe(false)
      
      act(() => {
        result.current.activate()
      })
      
      // Force a rerender to pick up the state change
      rerender()
      
      // The state should have changed reactively
      expect(result.current.isActive).toBe(true)
    })
  })

  describe('cleanup', () => {
    it('cleans up event listeners on unmount', () => {
      const removeEventListenerSpy = jest.spyOn(document, 'removeEventListener')
      
      const { result, unmount } = renderHook(() => useFocusTrap())
      
      // Create a container element for the ref
      const container = document.createElement('div')
      document.body.appendChild(container)
      
      // Manually set the ref
      Object.defineProperty(result.current.containerRef, 'current', {
        value: container,
        writable: true,
      })
      
      act(() => {
        result.current.activate()
      })
      
      unmount()
      
      // Should have removed keydown, mousedown, and focusin listeners
      expect(removeEventListenerSpy).toHaveBeenCalledWith('keydown', expect.any(Function), true)
      expect(removeEventListenerSpy).toHaveBeenCalledWith('mousedown', expect.any(Function), true)
      expect(removeEventListenerSpy).toHaveBeenCalledWith('focusin', expect.any(Function), true)
      
      removeEventListenerSpy.mockRestore()
    })
  })
})
