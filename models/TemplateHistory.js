// models/TemplateHistory.js
const mongoose = require('mongoose');

const TemplateHistorySchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  action: { type: String, enum: ['created', 'edited', 'deleted'], required: true },
  templateId: { type: String }, // can be ObjectId or prebuilt id like 'pre1'
  title: String,
  content: String,
  timestamp: { type: Date, default: Date.now },
  isPrebuilt: { type: Boolean, default: false }
});

module.exports = mongoose.model('TemplateHistory', TemplateHistorySchema);
