// Defines the fields stored for each note, including optional checklist data and its owner.
const mongoose = require('mongoose');

const noteSchema = new mongoose.Schema({
  title: { type: String, required: [true, 'Title is required'], trim: true },
  content: { type: String, required: [true, 'Content is required'] },
  tags: { type: [String], default: [] },
  pinned: { type: Boolean, default: false },
  checklistEnabled: { type: Boolean, default: false },
  checklist: [{
    text: { type: String, required: true, trim: true },
    completed: { type: Boolean, default: false },
  }],
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true, select: false },
}, { timestamps: true });

module.exports = mongoose.model('Note', noteSchema);
