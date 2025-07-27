const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

exports.sendReminder = async (to, msg, link) => {
  await transporter.sendMail({
    from: process.env.EMAIL_USER,
    to,
    subject: '⏰ Scheduled Message Reminder',
    html: `<p>${msg}</p><p><a href="${link}">Go to Message</a></p>`
  });
};
