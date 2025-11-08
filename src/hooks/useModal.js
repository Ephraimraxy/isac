import { useState, useEffect, useRef } from 'react'

/**
 * Custom hook for managing modal state and accessibility
 * Handles open/close state, focus management, and keyboard navigation
 */
export function useModal() {
  const [isOpen, setIsOpen] = useState(false)
  const modalRef = useRef(null)
  const previousFocusRef = useRef(null)

  const open = () => {
    previousFocusRef.current = document.activeElement
    setIsOpen(true)
  }

  const close = () => {
    setIsOpen(false)
    // Restore focus to previous element
    if (previousFocusRef.current) {
      previousFocusRef.current.focus()
    }
  }

  // Handle ESC key to close modal
  useEffect(() => {
    if (!isOpen) return

    const handleEscape = (e) => {
      if (e.key === 'Escape') {
        close()
      }
    }

    document.addEventListener('keydown', handleEscape)
    return () => document.removeEventListener('keydown', handleEscape)
  }, [isOpen])

  // Focus management for accessibility
  useEffect(() => {
    if (!isOpen || !modalRef.current) return

    // Focus first focusable element in modal
    const focusableElements = modalRef.current.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    )
    const firstElement = focusableElements[0]
    if (firstElement) {
      firstElement.focus()
    }

    // Trap focus within modal
    const handleTab = (e) => {
      if (e.key !== 'Tab') return

      const focusableElements = Array.from(
        modalRef.current.querySelectorAll(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        )
      )

      const firstElement = focusableElements[0]
      const lastElement = focusableElements[focusableElements.length - 1]

      if (e.shiftKey) {
        // Shift + Tab
        if (document.activeElement === firstElement) {
          e.preventDefault()
          lastElement.focus()
        }
      } else {
        // Tab
        if (document.activeElement === lastElement) {
          e.preventDefault()
          firstElement.focus()
        }
      }
    }

    modalRef.current.addEventListener('keydown', handleTab)
    return () => {
      if (modalRef.current) {
        modalRef.current.removeEventListener('keydown', handleTab)
      }
    }
  }, [isOpen])

  return {
    isOpen,
    open,
    close,
    modalRef
  }
}

