const mongoose = require('mongoose')

const DepositSchema = new mongoose.Schema({
  status: { type: String, required: true },
  type: { type: String, required: true },
  amount: { type: Number, required: true, min: 0 },
  currency: { type: String, required: true },
  per: { type: String, default: null },
  createdAt: { type: Date, default: Date.now },
  paidAt: { type: Date, default: null },
  user: { type: Number, required: true },
  email: { type: String, default: null },
}, { timestamps: true })

const Deposit = mongoose.model('Deposit', DepositSchema)

module.exports = Deposit
