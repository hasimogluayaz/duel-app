const BANNED_WORDS = [
  // Türkçe küfürler ve argo
  'sik', 'sikim', 'sikeyim', 'siktir', 'orospu', 'orosbuçu', 'göt', 'götü', 'amk', 'amına',
  'amını', 'bok', 'boktan', 'oç', 'piç', 'piçlik', 'kahpe', 'kaltak', 'şerefsiz', 'ibne',
  'götveren', 'ублюдок', 'hassiktir', 'lanet', 'it', 'köpek', 'eşek', 'mal', 'gerizekalı',
  'aptal', 'salak', 'kevaşe', 'sürtük', 'serseri', 'hıyar', 'gavat', 'pezevenk',
  // İngilizce küfürler
  'fuck', 'shit', 'bitch', 'asshole', 'bastard', 'cunt', 'dick', 'pussy', 'whore',
  'nigger', 'faggot',
]

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

  const lowerContent = content.toLowerCase()
  for (const word of BANNED_WORDS) {
    if (lowerContent.includes(word)) {
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
