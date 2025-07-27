const cron = require('node-cron');

exports.scheduleJob = (datetime, callback) => {
  const dt = new Date(datetime);
  const cronString = `${dt.getMinutes()} ${dt.getHours()} ${dt.getDate()} ${dt.getMonth() + 1} *`;

  cron.schedule(cronString, callback, { timezone: 'Asia/Kolkata' });
};
