// Defines the Mongoose schema and model for registered user accounts.
// Stores normalized, unique email addresses and hidden password hashes.
// Hashes new or changed passwords before they are saved to MongoDB.
// Provides a password comparison helper used by the login route.const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  password: { type: String, required: true, minlength: 8, select: false },
}, { timestamps: true });
userSchema.pre('save', async function hashPassword() {
  if (this.isModified('password')) this.password = await bcrypt.hash(this.password, 10);
});
userSchema.methods.checkPassword = function checkPassword(password) {
  return bcrypt.compare(password, this.password);
};

module.exports = mongoose.model('User', userSchema);
