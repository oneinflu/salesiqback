const mongoose = require('mongoose');

const companySchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  email: {
    type: String,
    required: true,
    unique: true
  },
  settings: {
    timezone: String,
    themeColor: String
  }
}, { timestamps: true });

module.exports = mongoose.model('Company', companySchema);
