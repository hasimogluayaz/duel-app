// Words matched as substrings (always offensive regardless of context)
const BANNED_SUBSTRINGS = [
  'sik', 'sikim', 'sikeyim', 'siktir', 'orospu', 'orosbuçu', 'amk', 'amına', 'amını',
  'hassiktir', 'götveren', 'ibne', 'kevaşe', 'sürtük', 'pezevenk', 'gavat',
  'fuck', 'shit', 'asshole', 'cunt', 'pussy', 'nigger', 'faggot',
]

// Words matched as whole words (can appear in innocent contexts otherwise)
const BANNED_WHOLE_WORDS = [
  'göt', 'götü', 'bok', 'boktan', 'oç', 'piç', 'piçlik', 'kahpe', 'kaltak',
  'şerefsiz', 'gerizekalı', 'hıyar', 'serseri',
  'bitch', 'bastard', 'dick', 'whore',
]

export function validateEmojiOnly(content: string): boolean {
  if (!content.trim()) return false
  // Reject if any standard Latin/digit/punctuation found
  return !/[a-zA-ZğüşıöçĞÜŞİÖÇ0-9.,!?;:()\-_"'@#$%^&*+=<>/\\[\]{}|`~]/.test(content.trim())
}

export function validateAnswer(content: string): { valid: boolean; error?: string } {
  if (!content || content.trim().length === 0) {
    return { valid: false, error: 'Cevap boş olamaz.' }
  }
  if (content.trim().length < 3) {
    return { valid: false, error: 'Cevap en az 3 karakter olmalı.' }
  }
  if (content.length > 280) {
    return { valid: false, error: 'Cevap 280 karakteri geçemez.' }
  }

  const lower = content.toLowerCase()

  for (const word of BANNED_SUBSTRINGS) {
    if (lower.includes(word)) {
      return { valid: false, error: 'Cevabınız uygunsuz içerik barındırıyor.' }
    }
  }

  for (const word of BANNED_WHOLE_WORDS) {
    const re = new RegExp(`(^|[^a-zA-ZğüşıöçĞÜŞİÖÇ])${word}([^a-zA-ZğüşıöçĞÜŞİÖÇ]|$)`, 'i')
    if (re.test(lower)) {
      return { valid: false, error: 'Cevabınız uygunsuz içerik barındırıyor.' }
    }
  }

  return { valid: true }
}

export function validateUsername(username: string): { valid: boolean; error?: string } {
  if (!username || username.length < 3) {
    return { valid: false, error: 'Kullanıcı adı en az 3 karakter olmalı.' }
  }
  if (username.length > 20) {
    return { valid: false, error: 'Kullanıcı adı 20 karakteri geçemez.' }
  }
  if (!/^[a-zA-Z0-9_]+$/.test(username)) {
    return { valid: false, error: 'Kullanıcı adı sadece harf, rakam ve alt çizgi içerebilir.' }
  }
  return { valid: true }
}

export function sanitizeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')
}
