// 📁 models/Template.js
const mongoose = require('mongoose');

const templateSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  title: { type: String, required: true },
  content: { type: String, required: true },
  isDefault: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now },
  originalId: { type: String },
  isPrebuilt: { type: Boolean, default: false },
});

module.exports = mongoose.model('Template', templateSchema);

