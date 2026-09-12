import assert from 'node:assert/strict'
import test from 'node:test'
import { classifyDocument } from '../src/components/scanner/documentClassifier.js'
import { extractFields } from '../src/components/scanner/fieldExtractor.js'

test('classifyDocument recognizes Aadhaar card', () => {
  const text = `
    भारत सरकार
    Government of India
    Saiesh Babu Upardekar
    जन्म तिथि / DOB: 10/10/2006
    मेरा आधार, मेरी पहचान
    8472 5584 2494
  `
  const result = classifyDocument(text)
  assert.equal(result.id, 'aadhaar')
  assert.equal(result.name, 'Aadhaar Card')
  assert.ok(result.confidence >= 80)
})

test('classifyDocument recognizes PAN card', () => {
  const text = `
    INCOME TAX DEPARTMENT
    GOVT. OF INDIA
    Permanent Account Number Card
    ABCDE1234F
    Name: ROHAN VERMA
    Father's Name: RAMESH VERMA
    Date of Birth: 15/08/1990
  `
  const result = classifyDocument(text)
  assert.equal(result.id, 'pan')
  assert.equal(result.name, 'PAN Card')
  assert.ok(result.confidence >= 80)
})

test('classifyDocument recognizes Driving Licence', () => {
  const text = `
    UNION OF INDIA
    DRIVING LICENCE
    TRANSPORT DEPARTMENT
    DL No: MH-14 20180012345
    Name: PRIYA SHARMA
    DOB: 22-04-1992
  `
  const result = classifyDocument(text)
  assert.equal(result.id, 'driving_licence')
  assert.equal(result.name, 'Driving Licence')
  assert.ok(result.confidence >= 80)
})

test('classifyDocument recognizes Election ID (Voter ID / EPIC)', () => {
  const text = `
    ELECTION COMMISSION OF INDIA
    ELECTOR PHOTO IDENTITY CARD
    EPIC NO: WBF1234567
    Elector's Name: AMIT ROY
    Father's Name: SUBHASH ROY
    Date of Birth: 12/04/1986
  `
  const result = classifyDocument(text)
  assert.equal(result.id, 'voter_id')
  assert.equal(result.name, 'Election ID (Voter ID)')
  assert.ok(result.confidence >= 80)
})

test('extractFields targets Full Name, ID Number, DOB, and Address on Aadhaar card', () => {
  const text = `
    To:
    Saiesh Babu Upardekar
    S/O Babu Upardekar
    H.No. 50, Non Mon
    Vasco-Da-Gama, Goa 403802
    भारत सरकार
    Government of India
    जन्म तिथि / 008 : 10102006
    8472 5584 2494
    मेरा आधार, मेरी पहचान
  `
  const fields = extractFields(text)
  assert.equal(fields.documentType.id, 'aadhaar')
  assert.equal(fields.name.value, 'Saiesh Babu Upardekar')
  assert.equal(fields.idNumber.value, '8472 5584 2494')
  assert.equal(fields.dateOfBirth.value, '10/10/2006')
  assert.match(fields.address.value, /Vasco-Da-Gama.*403802/)
})

test('extractFields targets Full Name, ID Number, DOB on PAN Card (avoiding Father Name)', () => {
  const text = `
    INCOME TAX DEPARTMENT
    GOVT. OF INDIA
    Permanent Account Number Card
    BKZPD4321E
    Name:
    KAVITA SURESH PATIL
    Father's Name:
    SURESH PATIL
    Date of Birth:
    24/09/1988
  `
  const fields = extractFields(text)
  assert.equal(fields.documentType.id, 'pan')
  assert.equal(fields.name.value, 'KAVITA SURESH PATIL')
  assert.equal(fields.idNumber.value, 'BKZPD4321E')
  assert.equal(fields.dateOfBirth.value, '24/09/1988')
})

test('extractFields targets Full Name, ID Number, DOB, and Address on Driving Licence', () => {
  const text = `
    UNION OF INDIA
    DRIVING LICENCE
    TRANSPORT DEPARTMENT MAHARASHTRA
    Licence No: MH-14 20180012345
    Name:
    VIKRAM JOSHI
    S/O: MANOHAR JOSHI
    DOB: 18-06-1991
    Address:
    Plot 5, Kothrud, Pune, Maharashtra 411038
  `
  const fields = extractFields(text)
  assert.equal(fields.documentType.id, 'driving_licence')
  assert.equal(fields.name.value, 'VIKRAM JOSHI')
  assert.equal(fields.idNumber.value, 'MH-14 20180012345')
  assert.equal(fields.dateOfBirth.value, '18-06-1991')
  assert.match(fields.address.value, /Pune.*Maharashtra.*411038/)
})

test('extractFields targets Full Name, ID Number, DOB, and Address on Election ID', () => {
  const text = `
    ELECTION COMMISSION OF INDIA
    ELECTOR PHOTO IDENTITY CARD
    EPIC No: WBF1234567
    Elector's Name: ANANYA ROY
    Father's Name: DEB ROY
    Date of Birth: 05/11/1985
    Address:
    Flat 3A, Lake Gardens, Kolkata, West Bengal 700045
  `
  const fields = extractFields(text)
  assert.equal(fields.documentType.id, 'voter_id')
  assert.equal(fields.name.value, 'ANANYA ROY')
  assert.equal(fields.idNumber.value, 'WBF1234567')
  assert.equal(fields.dateOfBirth.value, '05/11/1985')
  assert.match(fields.address.value, /Lake Gardens.*700045/)
})
