import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'

export default function ScrollToTop() {
  const { pathname, hash } = useLocation()

  useEffect(() => {
    // If there's a hash, let the browser handle the scroll to anchor
    if (hash) {
      // Small delay to ensure the element exists
      setTimeout(() => {
        const element = document.querySelector(hash)
        if (element) {
          element.scrollIntoView({ behavior: 'smooth' })
        }
      }, 100)
    } else {
      // Otherwise scroll to top on route change
      window.scrollTo(0, 0)
    }
  }, [pathname, hash])

  return null
}
