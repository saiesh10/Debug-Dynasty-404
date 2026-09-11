import { useEffect, useRef, useState } from 'react'
import GestureOverlay from './GestureOverlay'
import { useGestureDetector } from './useGestureDetector'

function GestureCamera({ onGesture, onCameraError }) {
  const videoRef = useRef(null)
  const streamRef = useRef(null)
  const [size, setSize] = useState({ width: 640, height: 480 })
  const { landmarks, gesture, error, ready } = useGestureDetector(videoRef)

  useEffect(() => {
    let cancelled = false

    const start = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false })
        if (cancelled) {
          stream.getTracks().forEach((track) => track.stop())
          return
        }
        streamRef.current = stream
        if (videoRef.current) {
          videoRef.current.srcObject = stream
          await videoRef.current.play()
          setSize({
            width: videoRef.current.videoWidth || 640,
            height: videoRef.current.videoHeight || 480,
          })
        }
      } catch {
        onCameraError?.('Camera permission was denied. Switch to button navigation.')
      }
    }

    start()
    return () => {
      cancelled = true
      streamRef.current?.getTracks().forEach((track) => track.stop())
    }
  }, [onCameraError])

  useEffect(() => {
    if (gesture) onGesture?.(gesture)
  }, [gesture, onGesture])

  return (
    <div className="gesture-stage">
      <div className="scan-frame">
        <video ref={videoRef} playsInline muted autoPlay aria-label="Gesture camera preview" />
        <GestureOverlay landmarks={landmarks} gesture={gesture} videoWidth={size.width} videoHeight={size.height} />
      </div>
      {!ready && <p className="scan-status">Loading hand tracking…</p>}
      {error && <p className="error-banner">{error}</p>}
    </div>
  )
}

export default GestureCamera
