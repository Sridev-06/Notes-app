// Defines the protected REST endpoints for a user's personal notes.
// Supports listing, searching, retrieving, creating, editing, and deleting notes.
// Validates request data and applies optional tag, search, and pin filters.
// Restricts every database operation to the account identified by the JWT.const express = require('express');
const mongoose = require('mongoose');
const Note = require('../models/Note');
const protect = require('../middleware/authMiddleware');
const router = express.Router();
const validId = (id) => mongoose.Types.ObjectId.isValid(id);
const validTags = (tags) => tags === undefined || (Array.isArray(tags) && tags.every((tag) => typeof tag === 'string'));
const validChecklist = (items) => items === undefined || (Array.isArray(items) && items.every((item) =>
  item && typeof item.text === 'string' && item.text.trim() &&
  (item.completed === undefined || typeof item.completed === 'boolean')));
const validationError = (error) => error.name === 'ValidationError' || error.name === 'CastError';
router.use(protect);
router.get('/', async (req, res) => {
  try {
    const { search, tag, pinned } = req.query;
    const filter = { user: req.user.id };
    if (search) {
      const escaped = search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      filter.$or = [{ title: { $regex: escaped, $options: 'i' } }, { content: { $regex: escaped, $options: 'i' } }];
    }
    if (tag) filter.tags = tag;
    if (pinned !== undefined) {
      if (!['true', 'false'].includes(pinned)) return res.status(400).json({ message: 'pinned must be true or false' });
      filter.pinned = pinned === 'true';
    }
    const notes = await Note.find(filter).sort({ pinned: -1, updatedAt: -1 });
    res.json({ notes });
  } catch (error) {
    res.status(500).json({ message: 'Could not retrieve notes', error: error.message });
  }
});
router.get('/:id', async (req, res) => {
  try {
    if (!validId(req.params.id)) return res.status(400).json({ message: 'Invalid note ID' });
    const note = await Note.findOne({ _id: req.params.id, user: req.user.id });
    if (!note) return res.status(404).json({ message: 'Note not found' });
    res.json({ note });
  } catch (error) {
    res.status(500).json({ message: 'Could not retrieve note', error: error.message });
  }
});
router.post('/', async (req, res) => {
  try {
    const { title, content, tags, pinned, checklistEnabled, checklist } = req.body || {};
    if (typeof title !== 'string' || !title.trim() || typeof content !== 'string' || !content.trim()) {
      return res.status(400).json({ message: 'Title and content are required' });
    }
    if (!validTags(tags) || (pinned !== undefined && typeof pinned !== 'boolean') ||
      (checklistEnabled !== undefined && typeof checklistEnabled !== 'boolean') || !validChecklist(checklist)) {
      return res.status(400).json({ message: 'Tags, pinned status, or checklist data is invalid' });
    }
    const note = await Note.create({
      title: title.trim(), content, tags: (tags || []).map((tag) => tag.trim()).filter(Boolean),
      pinned: pinned ?? false, checklistEnabled: checklistEnabled ?? false,
      checklist: checklistEnabled ? (checklist || []).map((item) => ({ text: item.text.trim(), completed: item.completed ?? false })).filter((item) => item.text) : [],
      user: req.user.id,
    });
    res.status(201).json({ message: 'Note created successfully', note });
  } catch (error) {
    res.status(validationError(error) ? 400 : 500).json({ message: 'Could not create note', error: error.message });
  }
});
router.put('/:id', async (req, res) => {
  try {
    if (!validId(req.params.id)) return res.status(400).json({ message: 'Invalid note ID' });
    const { title, content, tags, checklistEnabled, checklist } = req.body || {};
    if (typeof title !== 'string' || !title.trim() || typeof content !== 'string' || !content.trim()) {
      return res.status(400).json({ message: 'Title and content are required' });
    }
    if (!validTags(tags) || (checklistEnabled !== undefined && typeof checklistEnabled !== 'boolean') || !validChecklist(checklist)) {
      return res.status(400).json({ message: 'Tags or checklist data is invalid' });
    }
    const note = await Note.findOneAndUpdate({ _id: req.params.id, user: req.user.id }, {
      title: title.trim(), content, tags: (tags || []).map((tag) => tag.trim()).filter(Boolean),
      checklistEnabled: checklistEnabled ?? false,
      checklist: checklistEnabled ? (checklist || []).map((item) => ({ text: item.text.trim(), completed: item.completed ?? false })).filter((item) => item.text) : [],
    }, { new: true, runValidators: true });
    if (!note) return res.status(404).json({ message: 'Note not found' });
    res.json({ message: 'Note updated successfully', note });
  } catch (error) {
    res.status(validationError(error) ? 400 : 500).json({ message: 'Could not update note', error: error.message });
  }
});
router.delete('/:id', async (req, res) => {
  try {
    if (!validId(req.params.id)) return res.status(400).json({ message: 'Invalid note ID' });
    const note = await Note.findOneAndDelete({ _id: req.params.id, user: req.user.id });
    if (!note) return res.status(404).json({ message: 'Note not found' });
    res.json({ message: 'Note deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Could not delete note', error: error.message });
  }
});
router.patch('/:id/pin', async (req, res) => {
  try {
    if (!validId(req.params.id)) return res.status(400).json({ message: 'Invalid note ID' });
    const note = await Note.findOne({ _id: req.params.id, user: req.user.id });
    if (!note) return res.status(404).json({ message: 'Note not found' });
    note.pinned = !note.pinned;
    await note.save();
    res.json({ message: `Note ${note.pinned ? 'pinned' : 'unpinned'} successfully`, note });
  } catch (error) {
    res.status(500).json({ message: 'Could not change pin status', error: error.message });
  }
});

module.exports = router;
