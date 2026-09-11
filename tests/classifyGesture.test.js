import assert from 'node:assert/strict'
import test from 'node:test'
import { classifyGesture, FINGER } from '../src/components/gesture/classifyGesture.js'

function hand() {
  return Array.from({ length: 21 }, () => ({ x: 0.5, y: 0.5, z: 0 }))
}

function pose(options) {
  const landmarks = hand()
  landmarks[0] = { x: 0.5, y: 0.85, z: 0 }
  const layout = {
    thumb: { mcpX: 0.42, tipX: 0.38 },
    index: { mcpX: 0.46, tipX: 0.44 },
    middle: { mcpX: 0.5, tipX: 0.5 },
    ring: { mcpX: 0.54, tipX: 0.56 },
    pinky: { mcpX: 0.58, tipX: 0.62 },
  }
  for (const [name, finger] of Object.entries(FINGER)) {
    const extended = options[name] === 'extended'
    const { mcpX, tipX } = layout[name]
    landmarks[finger.mcp] = { x: mcpX, y: 0.62, z: 0 }
    landmarks[finger.tip] = extended
      ? { x: tipX, y: name === 'thumb' && options.thumbDir === 'down' ? 0.78 : 0.18, z: 0 }
      : { x: mcpX, y: 0.66, z: 0 }
  }
  return landmarks
}

test('classifyGesture recognizes the five supported poses', () => {
  assert.equal(classifyGesture(pose({ thumb: 'extended', index: 'extended', middle: 'extended', ring: 'extended', pinky: 'extended' })), 'open_palm')
  assert.equal(classifyGesture(pose({ thumb: 'curled', index: 'curled', middle: 'curled', ring: 'curled', pinky: 'curled' })), 'closed_fist')
  assert.equal(classifyGesture(pose({ thumb: 'extended', index: 'curled', middle: 'curled', ring: 'curled', pinky: 'curled' })), 'thumbs_up')
  assert.equal(classifyGesture(pose({ thumb: 'extended', index: 'curled', middle: 'curled', ring: 'curled', pinky: 'curled', thumbDir: 'down' })), 'thumbs_down')
  assert.equal(classifyGesture(pose({ thumb: 'curled', index: 'extended', middle: 'extended', ring: 'curled', pinky: 'curled' })), 'peace_sign')
})

test('classifyGesture returns null for ambiguous poses', () => {
  assert.equal(classifyGesture(pose({ thumb: 'extended', index: 'extended', middle: 'curled', ring: 'curled', pinky: 'curled' })), null)
  assert.equal(classifyGesture([]), null)
})
