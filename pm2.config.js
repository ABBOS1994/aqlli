const path = require('path')
require('dotenv').config({ path: path.resolve('.env') })

module.exports = {
  apps: [
    {
      name: 'misolai',
      script: 'index.js',
      watch: true,
      instances: 1, // 1 yoki 2 qilishingiz mumkin
      ignore_watch: ['config.json', 'images', 'voices']
    }
  ]
}
