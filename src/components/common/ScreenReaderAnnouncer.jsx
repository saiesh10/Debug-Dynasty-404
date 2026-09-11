import { useEffect } from 'react'

function ScreenReaderAnnouncer({ message }) {
  useEffect(() => {
    if (!message) return
  }, [message])

  return (
    <div
      aria-live="assertive"
      aria-atomic="true"
      className="sr-only"
    >
      {message}
    </div>
  )
}

export default ScreenReaderAnnouncer