import assert from 'node:assert/strict'
import test from 'node:test'
import { parseVoiceIntent } from '../src/components/voice/parseVoiceIntent.js'

test('parseVoiceIntent maps explore, emergency, and home commands', () => {
  assert.equal(parseVoiceIntent('explore schemes'), 'explore')
  assert.equal(parseVoiceIntent('Please open scanner'), 'explore')
  assert.equal(parseVoiceIntent('emergency'), 'emergency')
  assert.equal(parseVoiceIntent('go home'), 'home')
})

test('parseVoiceIntent returns null for unrelated text', () => {
  assert.equal(parseVoiceIntent('what is the weather'), null)
  assert.equal(parseVoiceIntent(''), null)
})
