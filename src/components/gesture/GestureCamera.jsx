import { useEffect, useRef, useState } from 'react'
import { useCamera } from '../../context/CameraContext'
import CameraErrorPanel from '../common/CameraErrorPanel'
import GestureOverlay from './GestureOverlay'
import { useGestureDetector } from './useGestureDetector'

function GestureCamera({ onGesture, compact = false, paused = false, onFallback }) {
  const videoRef = useRef(null)
  const { stream, errorInfo, startCamera, stopCamera, retryCamera, shouldOfferButtonFallback } = useCamera()
  const [size, setSize] = useState({ width: 640, height: 480 })
  const { landmarks, gesture, error, ready } = useGestureDetector(videoRef, { paused })

  useEffect(() => {
    startCamera()
    return () => stopCamera()
  }, [startCamera, stopCamera])

  useEffect(() => {
    const video = videoRef.current
    if (!video || !stream) return undefined
    video.srcObject = stream
    const play = async () => {
      try {
        await video.play()
        setSize({
          width: video.videoWidth || 640,
          height: video.videoHeight || 480,
        })
      } catch (err) {
        console.warn('[camera]', err.name, err.message)
      }
    }
    play()
    return undefined
  }, [stream])

  useEffect(() => {
    onGesture?.(gesture)
  }, [gesture, onGesture])

  return (
    <div className={`gesture-stage ${compact ? 'gesture-pip' : ''}`}>
      <div className={`scan-frame ${errorInfo ? 'placeholder' : ''}`}>
        {errorInfo ? (
          <>
            <span>Camera unavailable</span>
            <small>{errorInfo.userMessage}</small>
          </>
        ) : (
          <video ref={videoRef} playsInline muted autoPlay aria-label="Gesture camera preview" />
        )}
        {!errorInfo && (
          <GestureOverlay landmarks={landmarks} gesture={gesture} videoWidth={size.width} videoHeight={size.height} />
        )}
      </div>
      {!ready && !errorInfo && <p className="scan-status">Loading hand tracking…</p>}
      {error && <p className="error-banner">{error}</p>}
      <CameraErrorPanel
        errorInfo={errorInfo}
        onRetry={retryCamera}
        onFallback={onFallback}
        showFallbackAction={shouldOfferButtonFallback}
      />
    </div>
  )
}

export default GestureCamera
