const mongoose = require('mongoose');

const scheduleSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  platform: String,
  type: String,
  message: String,
  date: String,
  time: String,
  
  timezone: String,
  notifyEmail: Boolean,
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Schedule', scheduleSchema);

