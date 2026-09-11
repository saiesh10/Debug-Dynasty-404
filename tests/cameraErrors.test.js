import assert from 'node:assert/strict'
import test from 'node:test'
import { describeCameraError } from '../src/utils/cameraErrors.js'

test('describeCameraError branches on err.name', () => {
  assert.match(describeCameraError({ name: 'NotAllowedError', message: 'denied' }).userMessage, /denied/i)
  assert.match(describeCameraError({ name: 'NotFoundError', message: 'missing' }).userMessage, /No camera/)
  assert.equal(describeCameraError({ name: 'NotFoundError', message: 'missing' }).allowImmediateFallback, true)
  assert.match(describeCameraError({ name: 'NotReadableError', message: 'busy' }).userMessage, /in use/)
  assert.equal(describeCameraError({ name: 'NotReadableError', message: 'busy' }).allowImmediateFallback, false)
  assert.match(describeCameraError({ name: 'SecurityError', message: 'insecure' }).userMessage, /secure connection/)
  const other = describeCameraError({ name: 'AbortError', message: 'interrupted' })
  assert.match(other.userMessage, /AbortError/)
  assert.match(other.userMessage, /interrupted/)
})
