import assert from 'node:assert/strict'
import test from 'node:test'
import { extractFields } from '../src/components/scanner/fieldExtractor.js'

test('extractFields pulls name, dob, id, and address from OCR-like text', () => {
  const text = `Name: Kavya Rao
Date of Birth: 15/08/1990
Aadhaar: 1234 5678 9012
Address: 12 MG Road, Bengaluru, Karnataka`
  const fields = extractFields(text, [
    { text: 'Kavya', confidence: 88 },
    { text: 'Rao', confidence: 90 },
    { text: '15/08/1990', confidence: 80 },
    { text: '1234', confidence: 85 },
    { text: 'Karnataka', confidence: 77 },
  ])
  assert.match(fields.name.value, /Kavya/)
  assert.ok(fields.dateOfBirth.value.includes('15'))
  assert.ok(fields.idNumber.value.includes('1234'))
  assert.match(fields.address.value, /Karnataka/i)
  assert.ok(fields.name.confidence > 0)
})
