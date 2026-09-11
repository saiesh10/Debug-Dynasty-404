import { createContext, useCallback, useContext, useRef, useState } from 'react'
import { CAMERA_FAILED_RETRIES_BEFORE_FALLBACK, describeCameraError } from '../utils/cameraErrors'

const CameraContext = createContext(null)

export function CameraProvider({ children }) {
  const streamRef = useRef(null)
  const consumersRef = useRef(0)
  const inFlightRef = useRef(null)
  const [stream, setStream] = useState(null)
  const [errorInfo, setErrorInfo] = useState(null)
  const [failedRetries, setFailedRetries] = useState(0)

  const acquire = useCallback(async () => {
    if (streamRef.current) return streamRef.current
    if (inFlightRef.current) return inFlightRef.current

    if (!navigator.mediaDevices?.getUserMedia) {
      const fake = {
        name: 'NotFoundError',
        message: 'navigator.mediaDevices.getUserMedia is not available',
      }
      console.warn('[camera]', fake.name, fake.message)
      const info = describeCameraError(fake)
      setErrorInfo(info)
      setFailedRetries((count) => count + 1)
      return null
    }

    const request = (async () => {
      try {
        const next = await navigator.mediaDevices.getUserMedia({ video: true, audio: false })
        streamRef.current = next
        setStream(next)
        setErrorInfo(null)
        setFailedRetries(0)
        return next
      } catch (err) {
        console.warn('[camera]', err?.name, err?.message)
        const info = describeCameraError(err)
        setErrorInfo(info)
        setFailedRetries((count) => count + 1)
        return null
      } finally {
        inFlightRef.current = null
      }
    })()

    inFlightRef.current = request
    return request
  }, [])

  const startCamera = useCallback(async () => {
    consumersRef.current += 1
    return acquire()
  }, [acquire])

  const stopCamera = useCallback(() => {
    consumersRef.current = Math.max(0, consumersRef.current - 1)
    if (consumersRef.current > 0) return
    streamRef.current?.getTracks().forEach((track) => track.stop())
    streamRef.current = null
    setStream(null)
  }, [])

  const retryCamera = useCallback(async () => {
    streamRef.current?.getTracks().forEach((track) => track.stop())
    streamRef.current = null
    setStream(null)
    return acquire()
  }, [acquire])

  const shouldOfferButtonFallback =
    errorInfo?.allowImmediateFallback || failedRetries >= CAMERA_FAILED_RETRIES_BEFORE_FALLBACK

  const value = {
    stream,
    errorInfo,
    failedRetries,
    startCamera,
    stopCamera,
    retryCamera,
    shouldOfferButtonFallback,
  }

  return <CameraContext.Provider value={value}>{children}</CameraContext.Provider>
}

export function useCamera() {
  const context = useContext(CameraContext)
  if (!context) {
    throw new Error('useCamera must be used inside CameraProvider')
  }
  return context
}
