const path = require('path')
require('dotenv').config({ path: path.resolve('.env') })

module.exports = {
  apps: [
    {
      name: 'misolai',
      script: 'app.js',
      watch: true,
      ignore_watch: ['config.json', 'images', 'voices']
    }
  ]
}
