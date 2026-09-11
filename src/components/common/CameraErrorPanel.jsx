function CameraErrorPanel({ errorInfo, onRetry, onFallback, showFallbackAction }) {
  if (!errorInfo) return null

  return (
    <div className="error-banner" role="alert">
      <p>{errorInfo.userMessage}</p>
      <p className="error-detail">
        {errorInfo.name}: {errorInfo.message}
      </p>
      <div className="action-row">
        <button className="primary-button" type="button" onClick={onRetry}>
          Try camera again
        </button>
        {showFallbackAction && onFallback && (
          <button className="secondary-button" type="button" onClick={onFallback}>
            Switch to button navigation
          </button>
        )}
      </div>
    </div>
  )
}

export default CameraErrorPanel
