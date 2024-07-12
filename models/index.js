const mongoose = require('mongoose')

// Set `strictQuery` to true or false based on your preference
mongoose.set('strictQuery', true) // or false

mongoose
  .connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => console.log('MongoDB connected'))
  .catch((err) => console.error('MongoDB connection error:', err))

module.exports = mongoose
