const LeadCapture = require('../models/LeadCapture');
const Website = require('../models/Website');
const axios = require('axios');
const logger = require('../utils/logger');

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

    // Trigger Webhook if websiteId is present and has webhookUrl
    if (lead.websiteId) {
      try {
        const website = await Website.findById(lead.websiteId);
        if (website && website.webhookUrl) {
          logger.info(`Triggering webhook for website ${website._id} to ${website.webhookUrl}`);
          
          // Send lead data to webhook
          // Don't await this to avoid blocking the response, or await if reliability is critical
          // Here we choose to fire and forget but log error
          axios.post(website.webhookUrl, {
            event: 'lead.created',
            lead: lead
          }).catch(err => {
            logger.error(`Webhook trigger failed for website ${website._id}: ${err.message}`);
          });
        }
      } catch (webhookErr) {
        logger.error(`Error checking webhook for lead ${lead._id}: ${webhookErr.message}`);
      }
    }

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
