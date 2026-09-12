import assert from 'node:assert/strict'
import test from 'node:test'
import { extractFields } from '../src/components/scanner/fieldExtractor.js'

test('extractFields pulls name, dob, id, and address from OCR-like text', () => {
  const text = `Name: Kavya Rao
Date of Birth: 15/08/1990
Aadhaar: 2345 6789 0120
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
  assert.ok(fields.idNumber.value.includes('2345'))
  assert.match(fields.address.value, /Karnataka/i)
  assert.ok(fields.name.confidence > 0)
})

test('extractFields handles separated labels and multiline address layouts', () => {
  const text = `Applicant Name
Meera Sharma
Date of Birth - 2 January 1988
Driving Licence No: KA01 20240012345
Residential Address:
42 Lake View Road
Mysuru, Karnataka
Gender: Female`

  const fields = extractFields(text)

  assert.equal(fields.name.value, 'Meera Sharma')
  assert.equal(fields.dateOfBirth.value, '2 January 1988')
  assert.equal(fields.idNumber.value, 'KA01 20240012345')
  assert.equal(fields.address.value, '42 Lake View Road Mysuru, Karnataka')
})

const messySamples = [
  {
    name: 'Aadhaar with wrapped Hindi labels',
    text: 'भारत सरकार\nनाम:\nAnita Kumari\nजन्म तिथि: 07-11-1987\nआधार: 2345 6789 0120\nपता: House 4\nMG Road, Pune, Maharashtra 411001',
    expected: { name: 'Anita Kumari', dob: '07-11-1987', id: '2345 6789 0120', address: /Pune/ },
  },
  {
    name: 'PAN with OCR O versus zero',
    text: 'INCOME TAX DEPARTMENT\nName of Holder: Rohan Mehta\nPAN: ABCDE12O4F\nDOB 12/02/1991',
    expected: { name: 'Rohan Mehta', dob: '12/02/1991', id: 'ABCDE1204F' },
  },
  {
    name: 'Year of birth only',
    text: 'Name\nSaira Begum\nYear of Birth: 1978\nVoter ID: WB12 45678901\nAddress: Ward 3, Kolkata, West Bengal',
    expected: { name: 'Saira Begum', dob: '1978', id: 'WB12 45678901' },
  },
  {
    name: 'Unlabeled top-of-card name',
    text: 'Mohan Das\nGovernment of India\nDOB 01-01-1980\n9876 5432 1091\nVillage Rampur, District Jaipur, Rajasthan 302001',
    expected: { name: 'Mohan Das', dob: '01-01-1980', id: '9876 5432 1091', address: /Jaipur/ },
  },
  {
    name: 'Disability certificate with driving licence ID',
    text: 'DISABILITY CERTIFICATE\nApplicant Name: Priya Nair\nD.O.B: 2 March 1988\nDriving Licence No: KA01 20240012345\nResidential Address:\n42 Lake View Road\nMysuru, Karnataka',
    expected: { name: 'Priya Nair', dob: '2 March 1988', id: 'KA01 20240012345', address: /Mysuru/ },
  },
  {
    name: 'Ration card address block',
    text: 'राशन कार्ड\nनाम: Lakshmi Devi\nID No: DL012345678901\nपता:\n12/4 Main Street\nDistrict Delhi State Delhi Pin 110001\nGender: Female',
    expected: { name: 'Lakshmi Devi', id: 'DL012345678901', address: /110001/ },
  },
  {
    name: 'Address stops at following labels',
    text: 'Full Name: Abdul Rahman\nAddress: Flat 8, Green Nagar\nBengaluru Karnataka 560001\nFather Name: Karim\nDOB: 31/12/1975',
    expected: { name: 'Abdul Rahman', dob: '31/12/1975', address: /Green Nagar.*560001/ },
  },
  {
    name: 'Invalid ID is not guessed',
    text: 'Name: Neha Singh\nAadhaar: 1111 2222 3333\nIssue Date: 01/01/2022\nExpiry Date: 01/01/2032',
    expected: { name: 'Neha Singh', blankId: true, blankDob: true },
  },
  {
    name: 'OCR l and O confusion in DOB',
    text: 'Name: Vivek Rao\nDOB: 0l/0B/1990\nPAN: PQRSO1234K\nAddress: Sector 9, Noida, Uttar Pradesh 201301',
    expected: { name: 'Vivek Rao', dob: '01/08/1990', id: 'PQRSO1234K' },
  },
  {
    name: 'Skewed multiline regional address',
    text: 'नाम - Kavitha R\nजन्म वर्ष - 1965\nUIDAI 3456 7890 1232\nनिवास - 8 Temple Road\nCoimbatore, Tamil Nadu\nPin 641001',
    expected: { name: 'Kavitha R', dob: '1965', id: '3456 7890 1232', address: /Coimbatore.*641001/ },
  },
  {
    name: 'Real Production Aadhaar with Father Name and QR noise',
    text: `GOVERNMENT OF INDIA
UNIQUE IDENTIFICATION AUTHORITY OF INDIA
Enrollment No: 1234/56789/01234
To:
Rajesh Kumar Verma
S/O: Suresh Verma
DOB: 14/07/1982
Gender: MALE
Address:
Plot 102, Shanti Vihar
Bhopal, Madhya Pradesh 462001
Helpdesk: 1947
6789 1234 5678`,
    expected: {
      name: 'Rajesh Kumar Verma',
      dob: '14/07/1982',
      id: '6789 1234 5678',
      address: /Bhopal.*462001/,
    },
  },
  {
    name: 'Real Production PAN Card with Father Name and Permanent Account header',
    text: `INCOME TAX DEPARTMENT
GOVT. OF INDIA
Permanent Account Number Card
Name:
Sunita Anant Deshmukh
Father's Name: Anant Deshmukh
Date of Birth: 25/11/1976
BKZPD4321E
Signature`,
    expected: {
      name: 'Sunita Anant Deshmukh',
      dob: '25/11/1976',
      id: 'BKZPD4321E',
    },
  },
  {
    name: 'Real Production Disability Certificate with UDID and Department header',
    text: `DEPARTMENT OF EMPOWERMENT OF PERSONS WITH DISABILITIES
GOVERNMENT OF INDIA
Disability Certificate / Unique Disability ID
Applicant Name: Ananya Sen
Date of Birth: 05-09-1994
Gender: Female
Disability Type: Locomotor Disability (40%)
UDID Number: DL0810519940012345
Residential Address:
House 22, Chittaranjan Park
South Delhi, Delhi 110019`,
    expected: {
      name: 'Ananya Sen',
      dob: '05-09-1994',
      id: 'DL0810519940012345',
      address: /Chittaranjan Park.*110019/,
    },
  },
]

for (const sample of messySamples) {
  test(`messy OCR: ${sample.name}`, () => {
    const fields = extractFields(sample.text)
    assert.equal(fields.name.value, sample.expected.name)
    if (sample.expected.dob) assert.equal(fields.dateOfBirth.value, sample.expected.dob)
    if (sample.expected.id) assert.equal(fields.idNumber.value, sample.expected.id)
    if (sample.expected.address) assert.match(fields.address.value, sample.expected.address)
    if (sample.expected.blankId) assert.equal(fields.idNumber.value, '')
    if (sample.expected.blankDob) assert.equal(fields.dateOfBirth.value, '')
  })
}
