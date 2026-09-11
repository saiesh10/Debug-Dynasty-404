/**
 * Finger pose classifier on MediaPipe HandLandmarker (21 points), not a video ML model.
 *
 * We compare each fingertip’s distance from the wrist to the same finger’s MCP/knuckle
 * distance. That is more stable than raw y-ordering when the hand is rotated, which is
 * why open palm / fist / peace use distance, while thumbs up/down still use image Y
 * (thumb pointing toward the top or bottom of the frame).
 */
export const FINGER = {
  thumb: { tip: 4, mcp: 2 },
  index: { tip: 8, mcp: 5 },
  middle: { tip: 12, mcp: 9 },
  ring: { tip: 16, mcp: 13 },
  pinky: { tip: 20, mcp: 17 },
}

function distance(a, b) {
  const dz = (a.z || 0) - (b.z || 0)
  return Math.hypot(a.x - b.x, a.y - b.y, dz)
}

function isExtended(landmarks, finger, ratio = 1.18) {
  const wrist = landmarks[0]
  const tip = landmarks[finger.tip]
  const mcp = landmarks[finger.mcp]
  if (distance(tip, wrist) > distance(mcp, wrist) * ratio) return true
  // Thumbs up/down can point toward the wrist in image space; use MCP-to-tip length too.
  if (finger.tip === FINGER.thumb.tip && distance(tip, mcp) > 0.12) return true
  return false
}

function isCurled(landmarks, finger, ratio = 1.08) {
  const wrist = landmarks[0]
  const tip = landmarks[finger.tip]
  const mcp = landmarks[finger.mcp]
  return distance(tip, wrist) < distance(mcp, wrist) * ratio
}

export function classifyGesture(landmarks) {
  if (!landmarks || landmarks.length < 21) return null

  const thumbUp = isExtended(landmarks, FINGER.thumb)
  const indexUp = isExtended(landmarks, FINGER.index)
  const middleUp = isExtended(landmarks, FINGER.middle)
  const ringUp = isExtended(landmarks, FINGER.ring)
  const pinkyUp = isExtended(landmarks, FINGER.pinky)

  const thumbIn = isCurled(landmarks, FINGER.thumb)
  const indexIn = isCurled(landmarks, FINGER.index)
  const middleIn = isCurled(landmarks, FINGER.middle)
  const ringIn = isCurled(landmarks, FINGER.ring)
  const pinkyIn = isCurled(landmarks, FINGER.pinky)

  if (thumbUp && indexUp && middleUp && ringUp && pinkyUp) return 'open_palm'

  const othersCurled = indexIn && middleIn && ringIn && pinkyIn
  if (thumbUp && othersCurled) {
    const tipY = landmarks[FINGER.thumb.tip].y
    const mcpY = landmarks[FINGER.thumb.mcp].y
    if (tipY < mcpY - 0.035) return 'thumbs_up'
    if (tipY > mcpY + 0.035) return 'thumbs_down'
    return null
  }

  if ((thumbIn || !thumbUp) && othersCurled) return 'closed_fist'

  if (indexUp && middleUp && ringIn && pinkyIn) {
    const spread = distance(landmarks[FINGER.index.tip], landmarks[FINGER.middle.tip])
    const base = distance(landmarks[FINGER.index.mcp], landmarks[FINGER.middle.mcp])
    if (spread > base * 1.15) return 'peace_sign'
  }

  return null
}
