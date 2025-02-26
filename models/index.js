const mongoose = require('mongoose')
mongoose.connect(process.env.MONGO_URI)
.then(()=> console.log('DB ulandi'))
.catch(()=> console.log('DB ulanmadi!'))

module.exports = mongoose
