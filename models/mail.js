const mongoose = require('mongoose')

const mailSchema = new mongoose.Schema(
  {
    uid: { type: Number, required: true }, // Xabar yuboruvchi foydalanuvchi ID
    message: { type: Object, required: true }, // Xabar obyektini saqlaydi
    keyboard: { type: Array, default: [] }, // Inline tugmalar
    status: {
      type: String,
      enum: ['notStarted', 'doing', 'paused', 'stopped', 'ended'],
      default: 'notStarted',
    }, // ✅ Ruxsat etilgan statuslar bilan
    quantity: { type: Number, default: 0 }, // Qabul qiluvchilar soni
    preview: { type: Boolean, default: true }, // Oldindan ko'rish yoqilganmi
    success: { type: Number, default: 0 }, // Muvaffaqiyatli jo‘natilgan xabarlar
    unsuccess: { type: Number, default: 0 }, // Muvaffaqiyatsiz jo‘natilgan xabarlar
    all: { type: Number, default: 0 }, // Umumiy foydalanuvchilar soni
    startDate: { type: Date, index: true }, // Jo‘natish boshlanish vaqti
    endDate: { type: Date, index: true }, // Jo‘natish tugash vaqti
    errorsCount: { type: Map, of: Number, default: {} }, // ✅ Xatoliklarni optimallashtirish
  },
  { timestamps: true }, // ✅ Avtomatik `createdAt` va `updatedAt` qo‘shiladi
)

// Index qo‘shish (tezroq so‘rovlar uchun)
mailSchema.index({ status: 1, startDate: 1 })

const Mail = mongoose.model('Mail', mailSchema)

module.exports = Mail
