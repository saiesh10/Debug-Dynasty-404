import assert from 'node:assert/strict'
import test from 'node:test'
import { generateApplicationPDF } from '../src/components/application/generateApplicationPDF.js'

test('generateApplicationPDF embeds citizen fields in the document', () => {
  const doc = generateApplicationPDF(
    {
      name: 'Ananya Sharma',
      dateOfBirth: '12 August 1998',
      idNumber: '1234 5678 9012',
      address: 'Pune, Maharashtra',
    },
    {
      name: 'ADIP Assistive Devices Support',
      detail: 'Aids and appliances',
      amount: 'Up to Rs 15,000',
    },
  )
  const bytes = doc.output('arraybuffer')
  const text = Buffer.from(bytes).toString('latin1')
  assert.match(text, /Ananya Sharma/)
  assert.match(text, /12 August 1998/)
  assert.match(text, /1234 5678 9012/)
  assert.match(text, /Pune, Maharashtra/)
  assert.match(text, /ADIP Assistive Devices Support/)
  assert.match(text, /DS-/)
})
