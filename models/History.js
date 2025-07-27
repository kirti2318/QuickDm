const mongoose = require('mongoose');

const historySchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  type: {
    type: String, // 'compose', 'schedule', 'template'
    required: true
  },
  platform: String,       // for compose/schedule
  category: String,
  language: String,
  tone: String,
  message: String,        // for compose
  title: String,          // for template
  content: String,        // for template
  action: String,         // 'created', 'updated', 'deleted' (for templates)
  isPrebuilt: Boolean,    // true for prebuilt template history
  createdAt: {
    type: Date,
    default: Date.now
  },
  isFavorited: {
    type: Boolean,
    default: false
  },
   dateScheduled: Date,  // When the user scheduled it
  dateTrigger: Date,
  scheduleId: {
  type: mongoose.Schema.Types.ObjectId,
  ref: 'Schedule'
}
});

module.exports = mongoose.model('History', historySchema);



