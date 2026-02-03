const Company = require('../models/Company');
const Website = require('../models/Website');
const logger = require('../utils/logger');

// @desc    Create a new company and website
// @route   POST /api/companies
// @access  Private (Admin)
const createCompanyAndWebsite = async (req, res) => {
  const { companyName, companyEmail, websiteName, websiteUrl, timezone, themeColor, widgetColor, widgetPosition } = req.body;

  const session = await Company.startSession();
  session.startTransaction();

  try {
    // 1. Create Company
    const company = await Company.create([{
      name: companyName,
      email: companyEmail,
      settings: {
        timezone,
        themeColor
      }
    }], { session });

    const newCompany = company[0]; // create returns an array when using options

    // 2. Create Website linked to Company
    const website = await Website.create([{
      companyId: newCompany._id,
      name: websiteName || companyName + ' Website',
      url: websiteUrl,
      widgetConfig: {
        primaryColor: widgetColor,
        position: widgetPosition
      }
    }], { session });

    const newWebsite = website[0];

    await session.commitTransaction();
    session.endSession();

    res.status(201).json({
      message: 'Company and Website created successfully',
      company: {
        id: newCompany._id,
        name: newCompany.name,
        email: newCompany.email
      },
      website: {
        id: newWebsite._id,
        name: newWebsite.name,
        url: newWebsite.url
      },
      embedCode: `<script src="${process.env.WIDGET_URL || 'http://localhost:5001/widget.js'}" data-website-id="${newWebsite._id}"></script>`
    });

  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    logger.error('Create Company Error: ' + error.message);
    res.status(400).json({ message: error.message });
  }
};

// @desc    Get all companies
// @route   GET /api/companies
// @access  Private (Admin)
const getCompanies = async (req, res) => {
  try {
    const companies = await Company.find().sort({ createdAt: -1 });
    res.json(companies);
  } catch (error) {
    logger.error('Get Companies Error: ' + error.message);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Get websites for a company
// @route   GET /api/companies/:id/websites
// @access  Private (Admin)
const getCompanyWebsites = async (req, res) => {
  try {
    const websites = await Website.find({ companyId: req.params.id });
    res.json(websites);
  } catch (error) {
    logger.error('Get Websites Error: ' + error.message);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = {
  createCompanyAndWebsite,
  getCompanies,
  getCompanyWebsites
};
