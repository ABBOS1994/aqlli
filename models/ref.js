const mongoose = require('mongoose')

const refSchema = new mongoose.Schema(
  {
    name: { type: String, index: true, unique: true, required: true }, // Referal nomi (unikal)
    first: { type: Date, default: Date.now }, // Birinchi marta bosilgan vaqti
    last: { type: Date, default: Date.now }, // Oxirgi bosilgan vaqti
    count: { type: Number, default: 0 }, // Umumiy bosishlar soni
    uniqueCount: { type: Number, default: 0 }, // Faqat bir marta bosgan foydalanuvchilar
    newCount: { type: Number, default: 0 }, // Yangi foydalanuvchilar soni
    users: { type: [Number], default: [] }, // Referal bosgan foydalanuvchilar
    price: { type: Number, default: 0 }, // Narxi (agar bo‘lsa)
  },
  { timestamps: true }, // ✅ Avtomatik `createdAt` va `updatedAt` qo‘shiladi
)

// Indexlarni yaxshilash
refSchema.index({ name: 1, first: 1, last: 1 })

const Ref = mongoose.model('Ref', refSchema)

module.exports = Ref
