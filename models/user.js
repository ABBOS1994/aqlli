const mongoose = require('mongoose')

const userSchema = new mongoose.Schema(
  {
    id: {
      type: Number,
      index: true,
      unique: true,
      required: true,
    },
    name: { type: String, default: 'NoName' }, // Agar foydalanuvchi nomi bo‘lmasa
    username: { type: String, default: 'NoUsername' }, // Agar username bo‘lmasa
    state: { type: String, default: null }, // Hozirgi holati (agar mavjud bo‘lsa)
    lang: { type: String, default: 'uz' }, // Foydalanuvchi tili (default: uz)
    langCode: { type: String, default: 'uz' }, // Telegram lang code
    ban: { type: Boolean, default: false }, // Foydalanuvchi bloklanganmi?
    alive: { type: Boolean, default: true }, // Botda aktiv foydalanuvchi
    from: { type: String, default: null }, // Qayerdan kelgan (ref, reklama va h.k.)
    lastMessage: { type: Date, default: Date.now }, // Oxirgi xabar vaqti
    requests: { type: Number, default: 3 }, // Qancha so‘rov qila oladi
    deposit: { type: Number, default: 0 }, // Yig‘ilgan depozit
    vip: { type: Date, default: null }, // VIP obuna muddati
    earned: { type: Number, default: 0 }, // Foyda
    withdraw: { type: Number, default: 0 }, // Pul chiqarish
    refCount: { type: Number, default: 0 }, // Referallar soni
    acquainted: { type: Boolean, default: false }, // Foydalanuvchi bot bilan tanishmi?
    subscribed: { type: Boolean, default: false }, // Kanalga obuna bo‘lganmi?
  },
  {
    timestamps: true, // ✅ Avtomatik `createdAt` va `updatedAt` maydonlari qo‘shiladi
  },
)

// Indexlarni yaxshilash
userSchema.index({ id: 1, alive: 1 })

const User = mongoose.model('User', userSchema)

module.exports = User
