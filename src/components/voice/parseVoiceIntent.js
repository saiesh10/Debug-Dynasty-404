const WORD_TO_NUM = {
  one: 1,
  first: 1,
  '1st': 1,
  '1': 1,
  '१': 1,
  एक: 1,
  पहला: 1,
  पहली: 1,
  प्रथम: 1,
  ek: 1,
  pehla: 1,
  pehli: 1,

  two: 2,
  second: 2,
  '2nd': 2,
  '2': 2,
  to: 2,
  too: 2,
  '२': 2,
  दो: 2,
  दूसरा: 2,
  दूसरी: 2,
  do: 2,
  dusra: 2,
  dusri: 2,

  three: 3,
  third: 3,
  '3rd': 3,
  '3': 3,
  tree: 3,
  '३': 3,
  तीन: 3,
  तीसरा: 3,
  तीसरी: 3,
  teen: 3,
  teesra: 3,
  teesri: 3,

  four: 4,
  fourth: 4,
  '4th': 4,
  '4': 4,
  for: 4,
  '४': 4,
  चार: 4,
  चौथा: 4,
  चौथी: 4,
  chaar: 4,
  chautha: 4,
  chauthi: 4,

  five: 5,
  fifth: 5,
  '5th': 5,
  '5': 5,
  '५': 5,
  पांच: 5,
  पाँच: 5,
  पांचवां: 5,
  पांचवीं: 5,
  paanch: 5,
  panch: 5,
}

export function parseVoiceCommand(transcript) {
  if (!transcript || typeof transcript !== 'string') return null
  const text = transcript.toLowerCase().replace(/[^\p{L}\p{M}\p{N}\s]/gu, ' ').replace(/\s+/g, ' ').trim()
  if (!text) return null

  // 1. Emergency intents (English + Hindi)
    if (/\b(emergency|sos|help me|need help|emergency help|help)\b/i.test(text) ||
      /(?:आपातकाल|आपातकालीन|आपातकालीन सहायता|मदद|सहायता|इमरजेंसी|संकट|बचाओ|हेल्प|aapatkal|madad|sahayata|emergency madad|bachao)/i.test(text)) {
    return { intent: 'emergency', index: null, raw: text }
  }

  // 2. Home navigation (English + Hindi)
    if (/\b(go home|home|start over|main menu|cancel|exit|back to home|close assistant)\b/i.test(text) ||
      /(?:होम|होम पर जाएं|मुख्य पृष्ठ|मुख्य मेनू|मेनू|मेन्यू|शुरुआत|रद्द|बाहर निकलें|बंद करें|घर|ghar|ghar jao|ghar chalo|mukhya menu|shuruat|bahar niklo)/i.test(text)) {
    return { intent: 'home', index: null, raw: text }
  }

  // 3. Back navigation (English + Hindi)
    if (/\b(go back|back|previous|return|back to schemes|back to list)\b/i.test(text) ||
      /(?:वापस|पीछे|वापस जाएं|पिछला|पिछली स्क्रीन|वापस चलो|लौटो|पीछे जाएं|wapas|wapas jao|wapas chalo|peeche|lauto)/i.test(text)) {
    return { intent: 'back', index: null, raw: text }
  }

  // 4. PDF Save / Download intents (English + Hindi)
    if (/\b(save pdf|download pdf|create pdf|create application pdf|generate pdf|make pdf|get pdf|save application|download application|save document|download document|download|save file|save|download now|pdf|export pdf|print pdf)\b/i.test(text) ||
      /(?:पीडीएफ|पीडीएफ डाउनलोड|पीडीएफ सहेजें|पीडीएफ बनाएं|डाउनलोड|सहेजें|सेव|सेव पीडीएफ|डाउनलोड पीडीएफ|आवेदन पत्र|आवेदन डाउनलोड|प्रिंट|पीडीएफ बनाओ|पीडीएफ सेव करो|pdf download|pdf banao|pdf save|download karo|save karo)/i.test(text)) {
    return { intent: 'save_pdf', index: null, raw: text }
  }

  // 5. Choose scheme with index (English + Hindi, e.g. "योजना 1", "योजना २", "पहला स्कीम", "choose scheme 1", "select 2", "तीसरी योजना")
  const numKeywords = 'one|first|1st|1|two|second|2nd|2|to|too|three|third|3rd|3|tree|four|fourth|4th|4|for|five|fifth|5th|5|१|एक|पहला|पहली|प्रथम|२|दो|दूसरा|दूसरी|३|तीन|तीसरा|तीसरी|४|चार|चौथा|चौथी|५|पांच|पाँच|पांचवां|पांचवीं|ek|pehla|pehli|do|dusra|dusri|teen|teesra|teesri|chaar|chautha|paanch'
  const schemeMatch = text.match(new RegExp(`(?:choose|select|apply|open|pick|option|scheme|number|योजना|स्कीम|विकल्प|नंबर)?\\s*(${numKeywords})`))
  if (schemeMatch && (
    text.includes('scheme') ||
    text.includes('apply') ||
    text.includes('select') ||
    text.includes('choose') ||
    text.includes('option') ||
    text.includes('first') ||
    text.includes('second') ||
    text.includes('third') ||
    text.includes('number') ||
    text.includes('open') ||
    text.includes('योजना') ||
    text.includes('स्कीम') ||
    text.includes('विकल्प') ||
    text.includes('पहला') ||
    text.includes('दूसरा') ||
    text.includes('तीसरा') ||
    text.includes('चौथा') ||
    text.includes('आवेदन') ||
    text.includes('चुनें') ||
    text.includes('चुनो') ||
    text.includes('खोलो') ||
    text.includes('खोलें') ||
    /\b(yojana|yojna|scheme|vikalp|number|chuno|chune|kholo|kholen|lagoo|lagu)\b/i.test(text)
  )) {
    const num = WORD_TO_NUM[schemeMatch[1]] || 1
    return { intent: 'choose_scheme', index: num, raw: text }
  }

  // 6. General choose / apply without explicit number (English + Hindi)
    if (/\b(choose scheme|select scheme|apply scheme|apply for this scheme|apply for scheme|apply now|apply|choose this|select this|choose|select)\b/i.test(text) ||
      /(?:योजना चुनें|स्कीम चुनें|योजना लागू करें|आवेदन करें|चुनें|चुनो|लागू करें|पसंद करें|yojana chuno|yojna chuno|scheme chuno|aavedan karo|apply karo)/i.test(text)) {
    return { intent: 'choose_scheme', index: 1, raw: text }
  }

  // 7. Rescan intents (English + Hindi) - checked before explore so "दोबारा स्कैन" matches rescan
    if (/\b(rescan|rescan document|scan again|retake|re scan|retry|try again)\b/i.test(text) ||
      /(?:पुनः स्कैन|फिर से स्कैन|दोबारा स्कैन|दोबारा लें|फिर से लें|पुनः प्रयास|रीस्कैन|दोबारा फोटो|फिर से फोटो|dobara scan|phir se scan|phir scan|dobara photo)/i.test(text)) {
    return { intent: 'rescan', index: null, raw: text }
  }

  // 8. Explore / Scanner entry intents (English + Hindi)
    if (/\b(explore schemes|explore scheme|explore|open scanner|scan(ner)?|scan document|start scanning|start scan|begin scan|let's go|open scan)\b/i.test(text) ||
      /(?:योजनाएं खोजें|योजनाएं देखें|एक्सप्लोर|स्कैनर|स्कैनर खोलें|दस्तावेज स्कैन|दस्तावेज़ स्कैन|कार्ड स्कैन|स्कैन शुरू|स्कैन करो|स्कैन करें|yojana khojo|yojna khojo|yojana dekho|yojna dekho|scanner kholo|scan karo|dastavez scan)/i.test(text)) {
    return { intent: 'explore', index: null, raw: text }
  }

  // 9. Find schemes / Confirm / Proceed intents (English + Hindi)
    if (/\b(find schemes|find scheme|find my schemes|find my scheme|fine schemes|fine scheme|search schemes|show schemes|show my schemes|eligible schemes|check schemes|check eligible support|eligible support|check support|confirm details|confirm|proceed|continue|next|okay|ok|done|yes|go ahead|proceed with verified details|schemes|scheme)\b/i.test(text) ||
      /(?:योजना खोजें|मेरी योजनाएं|पात्रता जांचें|पुष्टि करें|आगे बढ़ें|आगे चलो|आगे जाएं|ठीक है|हाँ|जारी रखें|आगे|हो गया|तैयार|योजना बताओ|योजना दिखाओ|योजनाएं|स्कीम|yojana khojo|yojna khojo|meri yojana|meri yojnaye|aage badho|aage chalo|aage jao|theek hai|haan|jaari rakho|yojana batao|yojana dikhao|scheme dikhao)/i.test(text)) {
    return { intent: 'find_schemes', index: null, raw: text }
  }

  // 10. Scanner actions (English + Hindi)
    if (/\b(capture document|capture photo|take photo|capture|snap|take picture|click photo)\b/i.test(text) ||
      /(?:फोटो लें|कैप्चर|फोटो खींचो|तस्वीर लें|फोटो क्लिक करें|दस्तावेज़ कैप्चर|फोटो लो|तस्वीर लो|फोटो खींचें|photo lo|photo lo|tasveer lo|photo kheencho)/i.test(text)) {
    return { intent: 'capture', index: null, raw: text }
  }
    if (/\b(upload photo|upload document|upload image|upload file|upload)\b/i.test(text) ||
      /(?:फोटो अपलोड|अपलोड|तस्वीर अपलोड|फाइल अपलोड|दस्तावेज अपलोड|फोटो अपलोड करो|अपलोड करें|photo upload karo|file upload karo)/i.test(text)) {
    return { intent: 'upload', index: null, raw: text }
  }
    if (/\b(enter manually|manual entry|enter details manually|manual|type manually)\b/i.test(text) ||
      /(?:मैन्युअल|खुद भरें|लिखकर दर्ज करें|टाइप करें|हाथ से भरें|मैन्युअली|khud bharo|haath se bharo|manually bharo)/i.test(text)) {
    return { intent: 'manual', index: null, raw: text }
  }

  return null
}

export function parseVoiceIntent(transcript) {
  const parsed = parseVoiceCommand(transcript)
  if (!parsed) return null
  if (parsed.intent === 'choose_scheme' && parsed.index) {
    return `choose_scheme_${parsed.index}`
  }
  return parsed.intent
}
