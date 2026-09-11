import { useEffect, useRef, useState } from 'react'
import { FilesetResolver, HandLandmarker } from '@mediapipe/tasks-vision'
import { classifyGesture } from './classifyGesture'

const MODEL_URL = 'https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task'
const WASM_URL = 'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@1.0.1/wasm'

/** A pose must be held this long before it counts as a deliberate input. */
export const STABLE_GESTURE_MS = 500
export const GESTURE_LOST_GRACE_MS = 180

export function useGestureDetector(videoRef, { paused = false } = {}) {
  const landmarkerRef = useRef(null)
  const frameRef = useRef(null)
  const pendingRef = useRef({ id: null, since: 0 })
  const [landmarks, setLandmarks] = useState([])
  const [gesture, setGesture] = useState(null)
  const [error, setError] = useState(null)
  const [ready, setReady] = useState(false)

  useEffect(() => {
    let cancelled = false

    const setup = async () => {
      try {
        const vision = await FilesetResolver.forVisionTasks(WASM_URL)
        const landmarker = await HandLandmarker.createFromOptions(vision, {
          baseOptions: {
            modelAssetPath: MODEL_URL,
            delegate: 'CPU',
          },
          runningMode: 'VIDEO',
          numHands: 1,
        })
        if (cancelled) {
          landmarker.close()
          return
        }
        landmarkerRef.current = landmarker
        setReady(true)
      } catch (setupError) {
        console.error('[camera]', setupError.name, setupError.message)
        setError(setupError.message || 'Hand tracking could not load.')
      }
    }

    setup()
    return () => {
      cancelled = true
      if (frameRef.current) cancelAnimationFrame(frameRef.current)
      landmarkerRef.current?.close()
      landmarkerRef.current = null
    }
  }, [])

  useEffect(() => {
    if (!ready) return undefined
    let active = true

    const loop = () => {
      if (!active) return
      const video = videoRef.current
      const landmarker = landmarkerRef.current

      if (paused) {
        pendingRef.current = { id: null, since: 0 }
        setGesture(null)
      } else if (video && landmarker && video.readyState >= 2) {
        try {
          const result = landmarker.detectForVideo(video, performance.now())
          const nextLandmarks = result?.landmarks?.[0] || []
          setLandmarks(nextLandmarks)
          const next = classifyGesture(nextLandmarks)
          const now = performance.now()
          const pending = pendingRef.current

          if (next && next === pending.id) {
            pending.lastSeen = now
            const held = now - pending.since
            setGesture(held >= STABLE_GESTURE_MS ? next : null)
          } else if (!next && pending.id && now - pending.lastSeen < GESTURE_LOST_GRACE_MS) {
            setGesture(now - pending.since >= STABLE_GESTURE_MS ? pending.id : null)
          } else {
            pendingRef.current = { id: next, since: now, lastSeen: now }
            setGesture(null)
          }
        } catch (detectionError) {
          setError(detectionError?.message || 'Hand tracking could not process the camera frame.')
          setGesture(null)
        }
      }

      frameRef.current = requestAnimationFrame(loop)
    }

    frameRef.current = requestAnimationFrame(loop)
    return () => {
      active = false
      if (frameRef.current) cancelAnimationFrame(frameRef.current)
    }
  }, [paused, ready, videoRef])

  return { landmarks, gesture, error, ready }
}
