import { useEffect, useRef, useState } from 'react'
import { FilesetResolver, HandLandmarker } from '@mediapipe/tasks-vision'

const MODEL_URL = 'https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task'
const WASM_URL = 'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@1.0.1/wasm'

function isFingerExtended(landmarks, tip, pip) {
  return landmarks[tip].y < landmarks[pip].y
}

/**
 * Static pose classifier on HandLandmarker landmarks (not a full gesture-video model).
 * open_palm → explore/confirm, fist → back/cancel, point → emergency.
 */
export function classifyHandPose(landmarks) {
  if (!landmarks || landmarks.length < 21) return null
  const index = isFingerExtended(landmarks, 8, 6)
  const middle = isFingerExtended(landmarks, 12, 10)
  const ring = isFingerExtended(landmarks, 16, 14)
  const pinky = isFingerExtended(landmarks, 20, 18)
  const extended = [index, middle, ring, pinky].filter(Boolean).length

  if (extended >= 4) return 'open_palm'
  if (extended === 0) return 'fist'
  if (index && !middle && !ring && !pinky) return 'point'
  return null
}

export function useGestureDetector(videoRef) {
  const landmarkerRef = useRef(null)
  const frameRef = useRef(null)
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
      if (video && landmarker && video.readyState >= 2) {
        const result = landmarker.detectForVideo(video, performance.now())
        const nextLandmarks = result?.landmarks?.[0] || []
        setLandmarks(nextLandmarks)
        setGesture(classifyHandPose(nextLandmarks))
      }
      frameRef.current = requestAnimationFrame(loop)
    }

    frameRef.current = requestAnimationFrame(loop)
    return () => {
      active = false
      if (frameRef.current) cancelAnimationFrame(frameRef.current)
    }
  }, [ready, videoRef])

  return { landmarks, gesture, error, ready }
}
