const axios = require('axios');
const config = require('../config.json');
const { getToken } = require('../helpers/atmosTokenManager');

const User = require('../models/user');
const Deposit = require('../models/deposit');

module.exports = async (bot, i18n) => {
  const token = await getToken();
  const pendingDeposits = await Deposit.find({ status: 'pending' });

  for (const deposit of pendingDeposits) {
    try {
      if (!deposit.ext_id) continue;

      const res = await axios.post(
        'https://apigw.atmos.uz/mps/pay/get/ext_id',
        { ext_id: deposit.ext_id },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      const tx = res.data?.payload;
      if (!tx || tx.status !== 1 || tx.result_code !== 'Approved') continue;

      const user = await User.findOne({ id: deposit.user });
      if (!user) continue;

      const date =
        user.premium && user.premium > new Date()
          ? new Date(user.premium)
          : new Date();
      date.setHours(date.getHours() + Number(deposit.per));

      await Promise.all([
        User.updateOne(
          { id: user.id },
          { $set: { vip: date }, $inc: { deposit: deposit.amount } }
        ),
        bot.telegram.sendMessage(
          user.id,
          i18n.t('uz', 'vip.success', {
            date: date.toLocaleString('ru-RU', {
              year: 'numeric',
              month: 'long',
              day: 'numeric',
              hour: 'numeric',
              minute: 'numeric'
            })
          }),
          {
            disable_web_page_preview: true,
            parse_mode: 'HTML'
          }
        ),
        Deposit.updateOne(
          { _id: deposit._id },
          {
            paidAt: new Date(),
            status: 'paid',
            id: tx.id
          }
        ),
        Promise.all(
          config.admins.map((admin) =>
            bot.telegram.sendMessage(
              admin,
              `<a href='tg://user?id=${user.id}'>${user.name}</a>${user.username ? ` @${user.username}` : ''} <code>${user.id}</code> оплатил подписку до ${date.toLocaleString('ru-RU', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                hour: 'numeric',
                minute: 'numeric'
              })} на ${deposit.amount.format(0)} ${deposit.currency}`,
              { parse_mode: 'HTML' }
            )
          )
        )
      ]);
    } catch (err) {
      console.error('❌ Error in checkAtmos:', err.response?.data || err.message);
    }
  }
};
