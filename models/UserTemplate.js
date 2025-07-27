const mongoose = require('mongoose');

const UserTemplateSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  title: String,
  content: String,
  category: String,
  originalTemplateId: { type: mongoose.Schema.Types.ObjectId, ref: 'Template', default: null }
});

module.exports = mongoose.model('UserTemplate', UserTemplateSchema);
