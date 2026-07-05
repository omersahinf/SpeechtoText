const PHRASE_REPLACEMENTS: Array<[RegExp, string]> = [
  [/\b(?:i|ay)\s+think\b/gi, 'ay tink'],
  [/\b(?:i|ay)\s+thought\b/gi, 'ay tot'],
  [/\bright\s+and\b/gi, 'rayting']
]

const WORD_REPLACEMENTS: Array<[RegExp, string]> = [
  [/\b(?:writing|righting|wright(?:'|’)?ink|wrighting|writin|rightin)\b/gi, 'rayting'],
  [/\bdead\s*line\b/gi, 'dedlayn'],
  [/\bdeadline\b/gi, 'dedlayn'],
  [/\bdedline\b/gi, 'dedlayn'],
  [/\bmeeting\b/gi, 'miting'],
  [/\bmeting\b/gi, 'miting'],
  [/\breview\b/gi, 'rivyu'],
  [/\bdeploy\b/gi, 'diplöy'],
  [/\bbackend\b/gi, 'bekend'],
  [/\bfrontend\b/gi, 'frontent'],
  [/\bfullstack\b/gi, 'fulstek'],
  [/\bsoftware\b/gi, 'softver'],
  [/\bfeature\b/gi, 'fiçır'],
  [/\brelease\b/gi, 'riliz'],
  [/\bproduct\b/gi, 'pradakt'],
  [/\bproject\b/gi, 'procekt'],
  [/\bsprint\b/gi, 'sprint'],
  [/\btask\b/gi, 'task'],
  [/\bbug\b/gi, 'bag']
]

function normalizeEnglishApostropheSuffixes(text: string): string {
  return text
    .replace(/\b(dedlayn)(?:'|’)([a-zçğıöşü]+)/gi, '$1$2')
    .replace(/\b(rayting)(?:'|’)([a-zçğıöşü]+)/gi, '$1$2')
    .replace(/\b(miting)(?:'|’)([a-zçğıöşü]+)/gi, '$1$2')
    .replace(/\b(rivyu)(?:'|’)([a-zçğıöşü]+)/gi, '$1$2')
    .replace(/\b(diplöy)(?:'|’)([a-zçğıöşü]+)/gi, '$1$2')
}

export function applyTurkishPhoneticWriting(text: string): string {
  let next = text

  for (const [pattern, replacement] of PHRASE_REPLACEMENTS) {
    next = next.replace(pattern, replacement)
  }

  for (const [pattern, replacement] of WORD_REPLACEMENTS) {
    next = next.replace(pattern, replacement)
  }

  return normalizeEnglishApostropheSuffixes(next)
}
