export interface VoiceCommandResult {
  type: 'cancel' | 'undo' | 'repeat' | 'none'
}

// Türkçe karakterleri normalize eder (İ U+0130 toLowerCase() → "i" + combining dot olduğu için önce replace)
function normalizeForMatch(text: string): string {
  return text
    .replace(/İ/g, 'i') // U+0130 → i (önce replace, sonra toLowerCase)
    .replace(/İ/g, 'i') // combining dot after I
    .toLowerCase()
    .normalize('NFC') // combining chars → precomposed
    .trim()
}

const CANCEL_COMMANDS = new Set([
  'dur',
  'iptal',
  'hayır',
  'vazgeç',
  'sil',
  'temizle',
  'cancel',
  'stop',
  'abort',
  'nevermind'
])

const UNDO_PATTERNS = [
  /^(geri al|sil bunu|onu sil|önceki sil)\.?$/,
  /^(undo|delete that|remove that)\.?$/
]

const REPEAT_PATTERNS = [/^(tekrar|yeniden yaz|bir daha)\.?$/, /^(repeat|again|redo)\.?$/]

export function detectVoiceCommand(text: string): VoiceCommandResult {
  const normalized = normalizeForMatch(text).replace(/[.!]$/, '')

  if (CANCEL_COMMANDS.has(normalized)) {
    return { type: 'cancel' }
  }

  if (UNDO_PATTERNS.some((p) => p.test(normalized))) {
    return { type: 'undo' }
  }

  if (REPEAT_PATTERNS.some((p) => p.test(normalized))) {
    return { type: 'repeat' }
  }

  return { type: 'none' }
}

// Türkçe karakterlerle biten ifadeler için \b yerine (?=\s|$) kullanılır
const PUNCTUATION_MAP: [RegExp, string][] = [
  [/\bvirgül(?=\s|$)/gi, ','],
  [/\bnokta(?=\s|$)/gi, '.'],
  [/soru işareti/gi, '?'],
  [/ünlem işareti|(?<!\s)ünlem(?=\s|$)/gi, '!'],
  [/iki nokta üst üste|iki nokta/gi, ':'],
  [/noktalı virgül/gi, ';'],
  [/\btire(?=\s|$)/gi, '-'],
  [/yeni satır|alt satır/gi, '\n'],
  [/yeni paragraf/gi, '\n\n'],
  [/tırnak aç/gi, '"'],
  [/tırnak kapat/gi, '"'],
  [/parantez aç/gi, '('],
  [/parantez kapat/gi, ')'],
  [/köşeli parantez aç/gi, '['],
  [/köşeli parantez kapat/gi, ']'],
  [/büyük harf/gi, ''] // handled separately
]

export function applyVoicePunctuation(text: string): string {
  let result = text

  for (const [pattern, replacement] of PUNCTUATION_MAP) {
    if (replacement === '') continue // skip special commands
    result = result.replace(pattern, replacement)
  }

  // "büyük harf" → bir sonraki kelimeyi büyük yap
  result = result.replace(/büyük harf\s+(\S)/gi, (_, char: string) => char.toUpperCase())

  return result.trim()
}
