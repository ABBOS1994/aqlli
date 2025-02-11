const mongoose = require('mongoose')

let User = mongoose.Schema(
  {
    id: {
      type: Number,
      index: true,
      unique: true,
      required: true
    },
    name: String,
    username: String,
    state: String,
    lang: String,
    ban: {
      type: Boolean,
      default: false
    },
    langCode: String,
    alive: {
      type: Boolean,
      default: true
    },
    from: String,
    lastMessage: Date,
    requests: {
      type: Number,
      default: 3
    },
    deposit: Number,
    vip: Date,
    earned: {
      default: 0,
      type: Number
    },
    withdraw: {
      default: 0,
      type: Number
    },
    refCount: {
      default: 0,
      type: Number
    },
    acquainted: Boolean,
    subscribed: {
      type: Boolean,
      default: false
    }
  },
  {
    timestamps: true
  }
)
User = mongoose.model('User', User)

module.exports = User
