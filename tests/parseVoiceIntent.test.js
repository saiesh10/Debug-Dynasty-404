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

test('parseVoiceIntent and parseVoiceCommand handle Hindi commands fully', () => {
  // Explore & Scanner in Hindi
  assert.equal(parseVoiceIntent('योजनाएं खोजें'), 'explore')
  assert.equal(parseVoiceIntent('स्कैनर खोलें'), 'explore')
  assert.equal(parseVoiceIntent('दस्तावेज स्कैन करो'), 'explore')

  // Emergency & Home in Hindi
  assert.equal(parseVoiceIntent('आपातकाल'), 'emergency')
  assert.equal(parseVoiceIntent('आपातकालीन सहायता'), 'emergency')
  assert.equal(parseVoiceIntent('मदद चाहिए'), 'emergency')
  assert.equal(parseVoiceIntent('होम पर जाएं'), 'home')
  assert.equal(parseVoiceIntent('मुख्य मेनू'), 'home')

  // Back in Hindi
  assert.equal(parseVoiceIntent('वापस जाएं'), 'back')
  assert.equal(parseVoiceIntent('पीछे चलो'), 'back')

  // Find schemes / Confirm / Proceed in Hindi
  assert.equal(parseVoiceIntent('योजना खोजें'), 'find_schemes')
  assert.equal(parseVoiceIntent('मेरी योजनाएं दिखाओ'), 'find_schemes')
  assert.equal(parseVoiceIntent('पुष्टि करें'), 'find_schemes')
  assert.equal(parseVoiceIntent('आगे बढ़ें'), 'find_schemes')
  assert.equal(parseVoiceIntent('ठीक है'), 'find_schemes')

  // Scheme selection in Hindi
  assert.equal(parseVoiceIntent('योजना 1'), 'choose_scheme_1')
  assert.equal(parseVoiceIntent('योजना २'), 'choose_scheme_2')
  assert.equal(parseVoiceIntent('दूसरी योजना'), 'choose_scheme_2')
  assert.equal(parseVoiceIntent('तीसरी योजना चुनें'), 'choose_scheme_3')
  assert.equal(parseVoiceIntent('योजना चुनें'), 'choose_scheme_1')

  const cmdHi = parseVoiceCommand('योजना २ चुनो')
  assert.equal(cmdHi.intent, 'choose_scheme')
  assert.equal(cmdHi.index, 2)

  // PDF Save / Download in Hindi
  assert.equal(parseVoiceIntent('पीडीएफ डाउनलोड करें'), 'save_pdf')
  assert.equal(parseVoiceIntent('पीडीएफ सहेजें'), 'save_pdf')
  assert.equal(parseVoiceIntent('आवेदन पत्र डाउनलोड'), 'save_pdf')

  // Rescan, Capture, Upload in Hindi
  assert.equal(parseVoiceIntent('दोबारा स्कैन करें'), 'rescan')
  assert.equal(parseVoiceIntent('फिर से स्कैन करो'), 'rescan')
  assert.equal(parseVoiceIntent('फोटो खींचो'), 'capture')
  assert.equal(parseVoiceIntent('फोटो अपलोड करें'), 'upload')
})

test('parseVoiceIntent accepts common Romanized Hindi speech results', () => {
  assert.equal(parseVoiceIntent('yojana khojo'), 'explore')
  assert.equal(parseVoiceIntent('scanner kholo'), 'explore')
  assert.equal(parseVoiceIntent('aage badho'), 'find_schemes')
  assert.equal(parseVoiceIntent('theek hai'), 'find_schemes')
  assert.equal(parseVoiceIntent('yojana do chuno'), 'choose_scheme_2')
  assert.equal(parseVoiceIntent('dobara scan karo'), 'rescan')
  assert.equal(parseVoiceIntent('photo lo'), 'capture')
  assert.equal(parseVoiceIntent('pdf download karo'), 'save_pdf')
  assert.equal(parseVoiceIntent('wapas jao'), 'back')
  assert.equal(parseVoiceIntent('ghar jao'), 'home')
})

test('parseVoiceIntent returns null for unrelated text', () => {
  assert.equal(parseVoiceIntent('what is the weather'), null)
  assert.equal(parseVoiceIntent('आज मौसम कैसा है'), null)
  assert.equal(parseVoiceIntent(''), null)
})
