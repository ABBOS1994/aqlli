const mongoose = require('mongoose')

let Deposit = mongoose.Schema({
  status: String,
  type: String,
  amount: Number,
  currency: String,
  per: String,
  createdAt: Date,
  paidAt: Date,
  user: Number,
  email: String,
  id: mongoose.ObjectId
})
Deposit = mongoose.model('Deposit', Deposit)

module.exports = Deposit
