export const INDIAN_STATES = [
  'Andhra Pradesh',
  'Arunachal Pradesh',
  'Assam',
  'Bihar',
  'Chhattisgarh',
  'Goa',
  'Gujarat',
  'Haryana',
  'Himachal Pradesh',
  'Jharkhand',
  'Karnataka',
  'Kerala',
  'Madhya Pradesh',
  'Maharashtra',
  'Manipur',
  'Meghalaya',
  'Mizoram',
  'Nagaland',
  'Odisha',
  'Punjab',
  'Rajasthan',
  'Sikkim',
  'Tamil Nadu',
  'Telangana',
  'Tripura',
  'Uttar Pradesh',
  'Uttarakhand',
  'West Bengal',
  'Delhi',
]

export const NAME_PATTERNS = [
  /(?:name|full\s*name|naam)\s*[:-]\s*([A-Za-z][A-Za-z. ]{2,60})/i,
  /(?:govt\.?\s*of\s*india[\s\S]{0,80})?(?:to\s+)?([A-Z][a-z]+\s+[A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)/,
]

export const DOB_PATTERNS = [
  /(?:d\.?\s*o\.?\s*b\.?|date\s*of\s*birth|birth(?:day)?|dob)\s*[:-]?\s*([0-9]{1,2}[/.-][0-9]{1,2}[/.-][0-9]{2,4})/i,
  /(?:d\.?\s*o\.?\s*b\.?|date\s*of\s*birth|dob)\s*[:-]?\s*([0-9]{1,2}\s+[A-Za-z]{3,9}\s+[0-9]{4})/i,
  /\b([0-9]{1,2}[/.-][0-9]{1,2}[/.-][0-9]{4})\b/,
  /\b([0-9]{1,2}\s+(?:January|February|March|April|May|June|July|August|September|October|November|December)\s+[0-9]{4})\b/i,
]

export const ID_PATTERNS = [
  /(?:aadhaar|uid|uidai|id(?:entification)?\s*(?:no|number|#)?)\s*[:-]?\s*([0-9]{4}\s*[0-9]{4}\s*[0-9]{4})/i,
  /\b([0-9]{4}\s[0-9]{4}\s[0-9]{4})\b/,
  /(?:pan)\s*[:-]?\s*([A-Z]{5}[0-9]{4}[A-Z])/i,
  /\b([A-Z]{5}[0-9]{4}[A-Z])\b/,
]

export const ADDRESS_PATTERNS = [
  /(?:address|addr|residence)\s*[:-]\s*([^\n]{8,160})/i,
]
