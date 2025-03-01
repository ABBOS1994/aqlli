const convert = (str) => {
  if (!str) return str // Null, undefined yoki bo‘sh qiymat bo‘lsa, o‘zini qaytaradi

  const chars = {
    '<': '&lt;',
    '>': '&gt;',
    '&': '&amp;',
    '"': '&quot;',
    "'": '&#39;' // Xavfsizlik uchun bitta tirnoq ham almashtirildi
  }

  return str.replace(/[<>&"']/g, (char) => chars[char])
}

module.exports = convert
