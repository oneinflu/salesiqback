const Visitor = require('../models/Visitor');
const VisitorSession = require('../models/VisitorSession');

// Get all visitors (for admin "Visitors" page)
exports.getAllVisitors = async (req, res) => {
  try {
    const visitors = await Visitor.find().sort({ lastSeen: -1 });
    res.json(visitors);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Get visitor details
exports.getVisitor = async (req, res) => {
  try {
    const visitor = await Visitor.findById(req.params.id);
    if (!visitor) return res.status(404).json({ message: 'Visitor not found' });
    res.json(visitor);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Get visitor sessions
exports.getVisitorSessions = async (req, res) => {
  try {
    const sessions = await VisitorSession.find({ visitorId: req.params.id }).sort({ sessionStart: -1 });
    res.json(sessions);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
