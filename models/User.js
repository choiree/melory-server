const mongoose = require('mongoose');

const gallerySchema = new mongoose.Schema({
  type: {
    type: String,
    enum: ['Emoji', 'Photo'],
  },
  imageUrl: { type: Array },
  musicUrl: { type: String },
  artist: { type: String },
  album: { type: String },
  title: { type: String },
  genre: { type: String },
});

const userSchema = new mongoose.Schema({
  email: { type: String, require: true, unique: true },
  name: { type: String },
  gallery: [gallerySchema],
});

module.exports = mongoose.model('User', userSchema);
