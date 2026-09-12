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

export const PAN_ID_REGEX = /^[A-Z]{5}[0-9]{4}[A-Z]$/
export const EPIC_ID_REGEX = /^[A-Z]{3}[0-9]{7}$/
export const DL_ID_REGEX = /^[A-Z]{2}[0-9]{2}[\s\-]?[0-9]{11}$/i

export const NAME_PATTERNS = [
  /(?:elector(?:'s)?\s*name|मतदाता\s*का\s*नाम|full\s*name|applicant\s*name|name\s*of\s*(?:holder|applicant|cardholder)|\bname\b|naam)\s*[:#=-]?\s*([^\n]{2,80})/iu,
  /(?:नाम|नांव|नाव|आवेदक\s*का\s*नाम|धारक\s*का\s*नाम)\s*[:#=-]?\s*([^\n]{2,80})/u,
]

export const DOB_PATTERNS = [
  /(?:date\s*of\s*birth\s*[/|\\]\s*age|d\.?\s*o\.?\s*b\.?|date\s*of\s*birth|birth\s*date|dob|008|d0b|do8|जन्म\s*की\s*तारीख|जन्म\s*तिथि|जन्म\s*तारीख|दिनांक)\s*[:#=-]?\s*([0-9]{1,2}[/.-][0-9]{1,2}[/.-][0-9]{2,4})/iu,
  /(?:date\s*of\s*birth\s*[/|\\]\s*age|d\.?\s*o\.?\s*b\.?|date\s*of\s*birth|birth\s*date|dob|008|d0b|do8|जन्म\s*की\s*तारीख|जन्म\s*तिथि|जन्म\s*तारीख)\s*[:#=-]?\s*([0-9]{8})/iu,
  /(?:d\.?\s*o\.?\s*b\.?|date\s*of\s*birth|birth\s*date|dob|जन्म\s*की\s*तारीख|जन्म\s*तिथि|जन्म\s*तारीख)\s*[:#=-]?\s*([0-9]{1,2}\s+[A-Za-z]{3,12}\s+[0-9]{4})/iu,
  /(?:year\s*of\s*birth|yob|birth\s*year|जन्म\s*वर्ष)\s*[:#=-]?\s*((?:19|20)[0-9]{2})/iu,
]

export const VOTER_AGE_PATTERNS = [
  /(?:age\s*as\s*on\s*[^:\n]*|age|आयु|वय)\s*[:#=-]?\s*(\d{1,3})/iu,
]

export const ID_PATTERNS = [
  /\b([0-9]{4}[ \t]+[0-9]{4}[ \t]+[0-9]{4})\b/,
  /\b([0-9]{12})\b/,
  /\b([A-Z]{5}[0-9]{4}[A-Z])\b/i,
  /\b([A-Z]{2}[-\s]?[0-9]{2}[-\s]?(?:19|20)[0-9]{2}[-\s]?[0-9]{7})\b/i,
  /\b([A-Z]{2}[0-9]{2}\s*[0-9]{11})\b/i,
  /\b([A-Z]{2}[0-9]{2}\s*[0-9]{4,14})\b/i,
  /\b([A-Z]{3}[0-9]{7})\b/i,
  /\b([A-Z]{1,3}[0-9]{6,16})\b/i,
]

export const ADDRESS_PATTERNS = [
  /(?:residential\s*address|residence\s*address|permanent\s*address|perm\s*add|pres\s*add|address|addr|residence|पता|निवास|मुक्काम|पत्ता)\s*[:#=-]?\s*([^\n]{8,200})/iu,
  /(?:address|पता|निवास|पत्ता)\s*[:#=-]?\s*([\s\S]{10,180}?\d{6})/iu,
]

export const FIELD_LABEL_PATTERNS = {
  name: /(?:elector(?:'s)?\s*name|मतदाता\s*का\s*नाम|full\s*name|applicant\s*name|name\s*of\s*(?:holder|applicant|cardholder)|\bname\b|\bnaam\b|नाम|नांव|नाव|आवेदक\s*का\s*नाम)/iu,
  electorName: /(?:elector(?:'s)?\s*name|मतदाता\s*का\s*नाम|मतदार\s*नाव)/iu,
  dateOfBirth: /(?:date\s*of\s*birth|birth\s*date|\bdob\b|\bd[.\s]*o[.\s]*b\b|\b008\b|\bd0b\b|\bdo8\b|year\s*of\s*birth|\byob\b|birth\s*year|जन्म\s*की\s*तारीख|जन्म\s*तिथि|जन्म\s*वर्ष|जन्म\s*तारीख|दिनांक)/iu,
  idNumber: /(?:aadhaar|aadhar|\buidai\b|\buid\b|आधार|आधार\s*क्रमांक|\bpan\b|permanent\s*account|\bvoter\b|\bepic\b|election|driving\s*licen[cs]e|\bdl\s*no\b|\blicen[cs]e\s*no\b|\budid\b|disability\s*certificate|disability\s*id|\bid\s*(?:number|no|#)?\b|पहचान\s*पत्र|पहचान\s*संख्या|ओळख\s*पत्र)/iu,
  address: /(?:full\s*)?(?:residential\s*address|residence\s*address|permanent\s*address|\bperm\s*add\b|\bpres\s*add\b|\baddress\b|\baddr\b|residence|पता|निवास|मुक्काम|पत्ता)/iu,
}

export const INDIAN_PIN_PATTERN = /\b[1-9][0-9]{5}\b/

export const NAME_BLOCKLIST = [
  'government', 'govt', 'india', 'republic', 'state', 'union', 'national',
  'authority', 'commission', 'department', 'ministry', 'directorate', 'director',
  'uidai', 'aadhaar', 'aadhar', 'pan', 'income', 'tax', 'card', 'certificate',
  'disability', 'election', 'elector', 'voter', 'epic', 'driving', 'licence',
  'license', 'ration', 'male', 'female', 'transgender', 'gender', 'sex',
  'father', 'mother', 'husband', 'wife', 'guardian', 'relative', 'doctor',
  'signature', 'valid', 'validity', 'issue', 'expiry', 'expired', 'date',
  'address', 'resident', 'enrolment', 'helpdesk', 'tollfree', 'www', 'gov',
  'bharat', 'nirvachan', 'aayog', 'shri', 'smt', 'kumar', 's/o', 'd/o', 'w/o', 'c/o',
  's/d/w', 's/w/d',
  'भारत', 'सरकार', 'आधार', 'पहचान', 'पत्र', 'निर्वाचन', 'आयकर', 'प्रमाणपत्र',
  'दिव्यांगता', 'राशन', 'लिंग', 'पुरुष', 'महिला', 'पिता', 'पति', 'माता', 'आई', 'वडिल'
]

export const RELATIVE_PREFIXES = /^(?:father(?:'s)?|mother(?:'s)?|husband(?:'s)?|wife(?:'s)?|guardian(?:'s)?|s\/d\/w(?:\s*of)?|s\/w\/d(?:\s*of)?|c\/o|s\/o|d\/o|w\/o|care\s*of|son\s*of|daughter\s*of|wife\s*of|पिता|पति|माता|आई|आईचे\s*नाव|वडिल|वडिलांचे\s*नाव|पतीचे\s*नाव|संबंधी)\b/i

export const DL_VALIDITY_EXCLUSIONS = /(?:valid\s*(?:from|till|upto|until)|issue\s*date|expiry\s*date|issued\s*on|expires?\s*on|निर्गमन|जारी|समाप्ति|वैध)/i
