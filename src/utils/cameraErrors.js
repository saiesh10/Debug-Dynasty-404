export const CAMERA_FAILED_RETRIES_BEFORE_FALLBACK = 2

export function describeCameraError(err) {
  const name = err?.name || 'UnknownError'
  const message = err?.message || 'Unknown camera error'
  console.warn('[camera]', name, message)

  if (name === 'NotAllowedError' || name === 'PermissionDeniedError') {
    return {
      name,
      message,
      retryable: true,
      allowImmediateFallback: true,
      userMessage:
        "Camera access was denied. Open your browser's site settings and allow camera access for this site, then reload.",
    }
  }

  if (name === 'NotFoundError' || name === 'DevicesNotFoundError') {
    return {
      name,
      message,
      retryable: false,
      allowImmediateFallback: true,
      userMessage: 'No camera was found on this device.',
    }
  }

  if (name === 'NotReadableError' || name === 'TrackStartError') {
    return {
      name,
      message,
      retryable: true,
      allowImmediateFallback: false,
      userMessage:
        'Your camera seems to be in use by another application. Close other apps using the camera and try again.',
    }
  }

  if (name === 'SecurityError') {
    console.warn('[camera] origin', typeof window !== 'undefined' ? window.location.origin : 'unknown')
    return {
      name,
      message,
      retryable: false,
      allowImmediateFallback: true,
      userMessage:
        'Camera access requires a secure connection (https or localhost). Current origin is not secure.',
    }
  }

  return {
    name,
    message,
    retryable: true,
    allowImmediateFallback: false,
    userMessage: `${name}: ${message}`,
  }
}
