const mongoose = require('mongoose')

// Set `strictQuery` to true or false based on your preference
mongoose.set('strictQuery', true) // or false

mongoose
  .connect(process.env.MONGO_URI || process.env.MONGO_URI2 || 'mongodb://localhost:27017/aqlli')
  .then(() => console.log('MongoDB connected'))
  .catch((err) => console.error('MongoDB connection error:', err))

module.exports = mongoose
