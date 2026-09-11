import assert from 'node:assert/strict'
import test from 'node:test'
import { matchSchemes } from '../src/components/schemes/matchEngine.js'

test('an adult in Maharashtra matches several national and state schemes', () => {
  const matches = matchSchemes({
    name: 'Ananya Sharma',
    dateOfBirth: '12 August 1998',
    idNumber: '1234 5678 9012',
    address: 'Pune, Maharashtra',
    annualIncome: 180000,
  })
  const ids = matches.map((scheme) => scheme.id)
  assert.ok(ids.length >= 3, `expected multiple matches, got ${ids.join(', ')}`)
  assert.ok(ids.includes('maharashtra-udid-support'))
  assert.ok(ids.includes('skill-training'))
  assert.ok(!ids.includes('senior-care'))
  assert.ok(!ids.includes('pre-matric-scholarship'))
})

test('a toddler abroad with high income matches no schemes', () => {
  const matches = matchSchemes({
    name: 'Alex Rivera',
    dateOfBirth: '1 January 2024',
    address: 'Austin, Texas',
    annualIncome: 9000000,
  })
  assert.deepEqual(matches.map((scheme) => scheme.id), [])
})

test('missing date of birth and address matches fewer schemes', () => {
  const complete = matchSchemes({
    name: 'Ravi Kumar',
    dateOfBirth: '20 March 1999',
    address: 'Nagpur, Maharashtra',
    annualIncome: 150000,
  })
  const partial = matchSchemes({
    name: 'Ravi Kumar',
  })
  assert.ok(partial.length < complete.length)
  assert.ok(partial.every((scheme) => !scheme.minAge && !scheme.maxAge && (scheme.states || ['All']).includes('All')))
})
