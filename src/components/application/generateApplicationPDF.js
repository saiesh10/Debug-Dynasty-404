import { jsPDF } from 'jspdf'

export function generateApplicationPDF(citizenData = {}, scheme = {}) {
  const doc = new jsPDF()
  const referenceNumber = `DS-${Date.now()}`
  const name = citizenData.name || 'Not provided'
  const dob = citizenData.dateOfBirth || 'Not provided'
  const idNumber = citizenData.idNumber || 'Not provided'
  const address = citizenData.address || 'Not provided'
  const schemeName = scheme.name || 'Disability support scheme'

  doc.setFillColor(8, 127, 119)
  doc.rect(0, 0, 210, 28, 'F')
  doc.setTextColor(255, 255, 255)
  doc.setFontSize(18)
  doc.text('DivyangSetu Application', 14, 18)

  doc.setTextColor(23, 48, 66)
  doc.setFontSize(11)
  doc.text('This form is generated on-device for the citizen\'s records.', 14, 40)
  doc.text('It is not submitted to a government portal in this demo.', 14, 46)

  const docType = citizenData.documentType?.name || 'Government ID'

  doc.setFontSize(12)
  const rows = [
    ['Reference number', referenceNumber],
    ['Citizen name', name],
    ['Document type', docType],
    ['ID number', idNumber],
    ['Date of birth', dob],
    ['Address', address],
    ['Matched scheme', schemeName],
    ['Scheme detail', scheme.detail || 'See scheme listing in the app'],
    ['Support amount', scheme.amount || 'As per scheme rules'],
  ]

  let y = 62
  rows.forEach(([label, value]) => {
    doc.setFont('helvetica', 'bold')
    doc.text(`${label}:`, 14, y)
    doc.setFont('helvetica', 'normal')
    const wrapped = doc.splitTextToSize(String(value), 120)
    doc.text(wrapped, 70, y)
    y += Math.max(10, wrapped.length * 6 + 4)
  })

  doc.setFontSize(9)
  doc.setTextColor(96, 116, 130)
  doc.text('Private by design. DivyangSetu keeps identity details on this device.', 14, 285)
  doc.__referenceNumber = referenceNumber
  return doc
}
