/** Keep this catalog in sync with classifyGesture() and GestureGuide. */
export const GESTURE_CATALOG = [
  {
    id: 'open_palm',
    emoji: '✋',
    name: 'Open Palm',
    meaning: 'Namaste / Home / Help',
    action: 'Navigate to Home screen',
    feedback: 'Open palm recognized — going home',
  },
  {
    id: 'thumbs_up',
    emoji: '👍',
    name: 'Thumbs Up',
    meaning: 'Confirm / Yes',
    action: 'Trigger the current screen’s primary confirm/next action',
    feedback: 'Thumbs up recognized — confirming',
  },
  {
    id: 'thumbs_down',
    emoji: '👎',
    name: 'Thumbs Down',
    meaning: 'Reject / No / Back',
    action: 'Trigger the current screen’s back/cancel action',
    feedback: 'Thumbs down recognized — going back',
  },
  {
    id: 'peace_sign',
    emoji: '✌️',
    name: 'Peace Sign (V)',
    meaning: 'Explore Schemes',
    action: 'Navigate into the scanner flow',
    feedback: 'Peace sign recognized — opening scanner',
  },
  {
    id: 'closed_fist',
    emoji: '✊',
    name: 'Closed Fist',
    meaning: 'Emergency SOS / Help Desk',
    action: 'Navigate to Emergency screen from anywhere',
    feedback: 'Closed fist recognized — opening emergency help',
  },
]

export const GESTURE_GUIDE_SEEN_KEY = 'divyang-setu:gesture-guide-seen'

export function gestureById(id) {
  return GESTURE_CATALOG.find((item) => item.id === id) || null
}
