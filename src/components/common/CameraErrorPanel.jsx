import { useTranslation } from 'react-i18next'

function CameraErrorPanel({ errorInfo, onRetry, onFallback, showFallbackAction }) {
  const { t } = useTranslation('scanner')
  if (!errorInfo) return null

  return (
    <div className="error-banner" role="alert">
      <p>{errorInfo.userMessage}</p>
      <p className="error-detail">
        {errorInfo.name}: {errorInfo.message}
      </p>
      <div className="action-row">
        <button className="primary-button" type="button" onClick={onRetry}>
          {t('cameraErrors.tryAgain', 'Try camera again')}
        </button>
        {showFallbackAction && onFallback && (
          <button className="secondary-button" type="button" onClick={onFallback}>
            {t('cameraErrors.switchButtons', 'Switch to button navigation')}
          </button>
        )}
      </div>
    </div>
  )
}

export default CameraErrorPanel
