const mongoose = require('mongoose');
const Company = require('../models/Company');
const Website = require('../models/Website');
require('dotenv').config(); // Load from .env in current directory (backend/)

const MONGO_URI = process.env.MONGO_URI;

async function seed() {
  try {
    if (!MONGO_URI) {
      throw new Error("MONGO_URI is not defined in .env");
    }
    await mongoose.connect(MONGO_URI);
    console.log('Connected to MongoDB');

    // Check if default company exists
    let company = await Company.findOne({ email: 'admin@salesplatform.com' });
    if (!company) {
      company = await Company.create({
        name: 'Sales Platform Default',
        email: 'admin@salesplatform.com',
        settings: {
          timezone: 'UTC',
          themeColor: '#2563eb'
        }
      });
      console.log('Created Default Company:', company._id);
    } else {
      console.log('Default Company exists:', company._id);
    }

    // Check if default website exists
    let website = await Website.findOne({ companyId: company._id });
    if (!website) {
      website = await Website.create({
        companyId: company._id,
        name: 'My Website',
        url: 'http://localhost:3000',
        widgetConfig: {
          primaryColor: '#2563eb',
          position: 'right'
        }
      });
      console.log('Created Default Website:', website._id);
    } else {
      console.log('Default Website exists:', website._id);
    }

    console.log('\n=== INTEGRATION IDs ===');
    console.log(`companyId: ${company._id}`);
    console.log(`websiteId: ${website._id}`);
    console.log('=======================\n');

  } catch (error) {
    console.error('Seeding error:', error);
  } finally {
    await mongoose.disconnect();
  }
}

seed();
