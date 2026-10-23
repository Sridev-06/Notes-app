// Defines the Mongoose schema and model for note documents.
// Specifies note text, tags, pin state, optional checklist, and owner fields.
// Sets required values and defaults used when note documents are created.
// Enables automatic creation and update timestamps for each note.const mongoose = require('mongoose');

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
