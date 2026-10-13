'use strict';
// نقطة الدخول على Vercel (Serverless Function). كل الطلبات اللي مش ملفات ثابتة بتيجي هنا.
const { handle, whatsapp } = require('../lib/app');

module.exports = async (req, res) => {
  await handle(req, res);
  await whatsapp.idle();   // استنى لحد ما رسائل الواتساب تتبعت قبل ما الدالة تتجمّد
};
