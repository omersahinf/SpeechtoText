/** İki string için Levenshtein mesafesi. */
export function levenshtein(a: string, b: string): number {
  if (a === b) return 0
  if (a.length === 0) return b.length
  if (b.length === 0) return a.length

  const prev = new Array<number>(b.length + 1)
  const curr = new Array<number>(b.length + 1)

  for (let j = 0; j <= b.length; j += 1) prev[j] = j

  for (let i = 1; i <= a.length; i += 1) {
    curr[0] = i
    for (let j = 1; j <= b.length; j += 1) {
      const cost = a.charCodeAt(i - 1) === b.charCodeAt(j - 1) ? 0 : 1
      curr[j] = Math.min(
        (prev[j] ?? 0) + 1, // delete
        (curr[j - 1] ?? 0) + 1, // insert
        (prev[j - 1] ?? 0) + cost // substitute
      )
    }
    for (let j = 0; j <= b.length; j += 1) prev[j] = curr[j] ?? 0
  }

  return prev[b.length] ?? 0
}

/** 0..1 arası benzerlik skoru. 1 = aynı, 0 = tamamen farklı. */
export function similarity(a: string, b: string): number {
  const maxLen = Math.max(a.length, b.length)
  if (maxLen === 0) return 1
  return 1 - levenshtein(a, b) / maxLen
}

/** Türkçe için normalize: küçük harf, fazla boşlukları kırp, noktalama'yı eşle. */
export function normalizeTurkish(text: string): string {
  return text.toLocaleLowerCase('tr').replace(/\s+/g, ' ').trim()
}

/** Normalize edilmiş benzerlik — değerlendirme için tipik kullanım. */
export function normalizedSimilarity(a: string, b: string): number {
  return similarity(normalizeTurkish(a), normalizeTurkish(b))
}
