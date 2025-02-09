const shell = require('shelljs')

module.exports = (filePath, params = {}) => {
  if (!filePath || typeof filePath !== 'string') {
    return Promise.reject(new Error('Fayl manzili noto‘g‘ri!'))
  }

  const cmdParams = Object.entries(params)
    .map(([key, value]) => `--${key} "${String(value).replace(/"/g, '\\"')}"`) // Xavfsiz formatlash
    .join(' ')

  const command = `whisper ${cmdParams} "${filePath}"` // Fayl nomini ham xavfsiz qilish

  return new Promise((resolve, reject) => {
    shell.exec(command, { silent: true }, (code, stdout, stderr) => {
      if (code === 0) {
        resolve(stdout.trim())
      } else {
        console.error(`Whisper xatosi: ${stderr.trim()}`)
        reject(new Error(`Whisper bajarilmadi! Xato kodi: ${code}`))
      }
    })
  })
}
