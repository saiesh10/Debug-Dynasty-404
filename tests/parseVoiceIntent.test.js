import assert from 'node:assert/strict'
import test from 'node:test'
import { parseVoiceIntent, parseVoiceCommand } from '../src/components/voice/parseVoiceIntent.js'

test('parseVoiceIntent maps explore, emergency, and home commands', () => {
  assert.equal(parseVoiceIntent('explore schemes'), 'explore')
  assert.equal(parseVoiceIntent('Please open scanner'), 'explore')
  assert.equal(parseVoiceIntent('emergency'), 'emergency')
  assert.equal(parseVoiceIntent('go home'), 'home')
})

test('parseVoiceIntent and parseVoiceCommand map talk-to-navigate flow', () => {
  assert.equal(parseVoiceIntent('find schemes'), 'find_schemes')
  assert.equal(parseVoiceIntent('find scheme'), 'find_schemes')
  assert.equal(parseVoiceIntent('find my schemes'), 'find_schemes')
  assert.equal(parseVoiceIntent('confirm details'), 'find_schemes')
  assert.equal(parseVoiceIntent('proceed'), 'find_schemes')

  assert.equal(parseVoiceIntent('choose scheme 1'), 'choose_scheme_1')
  assert.equal(parseVoiceIntent('choose scheme'), 'choose_scheme_1')
  assert.equal(parseVoiceIntent('select scheme 2'), 'choose_scheme_2')
  assert.equal(parseVoiceIntent('apply scheme 3'), 'choose_scheme_3')
  assert.equal(parseVoiceIntent('first scheme'), 'choose_scheme_1')

  const cmd = parseVoiceCommand('choose scheme 2')
  assert.equal(cmd.intent, 'choose_scheme')
  assert.equal(cmd.index, 2)

  assert.equal(parseVoiceIntent('save pdf'), 'save_pdf')
  assert.equal(parseVoiceIntent('download pdf'), 'save_pdf')
  assert.equal(parseVoiceIntent('create application pdf'), 'save_pdf')

  assert.equal(parseVoiceIntent('rescan document'), 'rescan')
  assert.equal(parseVoiceIntent('capture photo'), 'capture')
  assert.equal(parseVoiceIntent('upload photo'), 'upload')
})

test('parseVoiceIntent returns null for unrelated text', () => {
  assert.equal(parseVoiceIntent('what is the weather'), null)
  assert.equal(parseVoiceIntent(''), null)
})
