const User = require('../models/user')
const config = require('../config')
const axios = require('axios')
const FormData = require('form-data')

module.exports = async () => {
  if (!config.botStat?.send && !config.botStat?.botMan) return

  const query = config.botStat.alive ? { alive: true } : {}
  const users = await User.find(query, '-_id id').lean()
  const content = users.map((user) => Object.values(user).join(';')).join('\n')

  const formData = new FormData()
  formData.append('file', Buffer.from(content, 'utf8'))

  if (config.botStat?.send && config.botStat?.key) {
    await axios.post(
      `https://api.botstat.io/create/${process.env.BOT_TOKEN}/${config.botStat.key}?notify_id=${config.admins[0]}`,
      formData,
      { headers: { ...formData.getHeaders() } },
    )
  }

  if (config.botStat?.botMan) {
    await axios.post(
      `https://api.botstat.io/botman/${process.env.BOT_TOKEN}?owner_id=${config.admins[0]}`,
      formData,
      { headers: { ...formData.getHeaders() } },
    )
  }
}
