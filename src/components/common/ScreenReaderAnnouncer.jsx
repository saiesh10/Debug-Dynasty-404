function ScreenReaderAnnouncer({ message }) {
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