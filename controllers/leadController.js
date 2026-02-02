const LeadCapture = require('../models/LeadCapture');

// Get all leads
exports.getAllLeads = async (req, res) => {
  try {
    const leads = await LeadCapture.find().sort({ createdAt: -1 });
    res.json(leads);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Create a lead
exports.createLead = async (req, res) => {
  try {
    const lead = new LeadCapture(req.body);
    await lead.save();
    res.status(201).json(lead);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

// Update a lead
exports.updateLead = async (req, res) => {
  try {
    const lead = await LeadCapture.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    if (!lead) {
      return res.status(404).json({ error: 'Lead not found' });
    }
    res.json(lead);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};
