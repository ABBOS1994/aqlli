const mongoose = require('mongoose')
mongoose
  .connect(
    'mongodb+srv://maxfiydasturchi:pVXTDewgtZjUkgse@misol-ai-bot.k3v91.mongodb.net/?retryWrites=true&w=majority&appName=misol-ai-bot',
    {
      serverSelectionTimeoutMS: 30000,
      useNewUrlParser: true,
      useUnifiedTopology: true
    }
  )
  .then(() => console.log('MongoDBga ulanish muvaffaqiyatli!'))
  .catch((err) => console.error('MongoDB ulanishda xatolik:', err))

module.exports = mongoose
