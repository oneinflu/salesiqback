const UAParser = require('ua-parser-js');
const geoip = require('geoip-lite');
const mongoose = require('mongoose');
const Joi = require('joi');
const logger = require('../utils/logger');
const Visitor = require('../models/Visitor');
const Message = require('../models/Message');
const VisitorSession = require('../models/VisitorSession');
const Chat = require('../models/Chat');
const LeadCapture = require('../models/LeadCapture');

// Rate Limiting Map (Simple in-memory for this example, use Redis for prod)
const rateLimitMap = new Map();

const checkRateLimit = (socketId) => {
    const now = Date.now();
    const limit = 5; // 5 events per second
    const windowMs = 1000;
    
    if (!rateLimitMap.has(socketId)) {
        rateLimitMap.set(socketId, []);
    }
    
    const timestamps = rateLimitMap.get(socketId);
    const windowStart = now - windowMs;
    
    // Filter old timestamps
    const validTimestamps = timestamps.filter(ts => ts > windowStart);
    
    if (validTimestamps.length >= limit) {
        return false;
    }
    
    validTimestamps.push(now);
    rateLimitMap.set(socketId, validTimestamps);
    return true;
};

// Validation Schemas
const schemas = {
    visitorJoin: Joi.object({
        companyId: Joi.string().required(),
        websiteId: Joi.string().optional(),
        pageUrl: Joi.string().uri({ allowRelative: true }).optional(),
        userAgent: Joi.string().optional(),
        existingVisitorId: Joi.string().optional(),
        sessionId: Joi.string().optional()
    }),
    visitorHeartbeat: Joi.object({
        sessionId: Joi.string().required()
    }),
    leadCapture: Joi.object({
        name: Joi.string().min(2).max(100).required(),
        email: Joi.string().email().required(), // RFC 5322 compliant by default in Joi
        phone: Joi.string().pattern(/^[+]?[(]?[0-9]{3}[)]?[-\s.]?[0-9]{3}[-\s.]?[0-9]{4,6}$/).required(), // Basic phone regex
        visitorId: Joi.string().required(),
        companyId: Joi.string().required(),
        chatId: Joi.string().optional()
    })
};

module.exports = (io) => {
    // Admin Namespace
    const adminIo = io.of('/admin'); // If we want a separate namespace, but current app uses main namespace for admin rooms

    io.on('connection', (socket) => {
        logger.info(`New connection: ${socket.id}`);
        
        // Track auto-open timer per socket
        let autoOpenTimer = null;
        let heartbeatInterval = null;

        // Middleware for Rate Limiting
        socket.use(([event, ...args], next) => {
            if (!checkRateLimit(socket.id)) {
                logger.warn(`Rate limit exceeded for socket ${socket.id}`);
                return next(new Error('Rate limit exceeded'));
            }
            next();
        });

        // --- VISITOR EVENTS ---

        // 1. visitor:join
        socket.on('visitor:join', async (data, callback) => {
            try {
                // Validation
                const { error, value } = schemas.visitorJoin.validate(data);
                if (error) {
                    logger.error(`Validation error in visitor:join: ${error.message}`);
                    if (callback) callback({ error: error.message });
                    return;
                }

                const { companyId, websiteId, pageUrl, userAgent, existingVisitorId, sessionId: clientSessionId } = value;

                // IP Extraction & GeoIP
                let ip = socket.handshake.headers['x-forwarded-for'] || socket.handshake.address;
                
                // Dev Mock (keep for user convenience)
                if (process.env.NODE_ENV === 'development' || ip === '::1' || ip === '127.0.0.1' || !ip) {
                    ip = '14.143.190.10'; // Mock India IP
                }

                const geo = geoip.lookup(ip);
                const country = geo ? geo.country : 'Unknown';
                const city = geo ? geo.city : 'Unknown';
                const region = geo ? geo.region : 'Unknown';

                // UA Parsing
                const ua = new UAParser(userAgent);
                const browser = ua.getBrowser();
                const device = ua.getDevice();
                const os = ua.getOS();

                const browserName = `${browser.name || 'Unknown'} ${browser.version || ''}`.trim();
                const deviceType = device.type || 'desktop'; // default to desktop if undefined
                
                // Visitor Record
                let visitor;
                if (existingVisitorId && mongoose.isValidObjectId(existingVisitorId)) {
                    visitor = await Visitor.findById(existingVisitorId);
                }

                const visitorData = {
                    companyId,
                    userAgent,
                    ip,
                    status: 'online',
                    lastSeen: new Date(),
                    location: { country, city, region },
                    device: { type: deviceType, browser: browserName, os: os.name || 'Unknown' }
                };

                if (!visitor) {
                    visitor = new Visitor(visitorData);
                } else {
                    Object.assign(visitor, visitorData);
                    visitor.socketId = socket.id;
                }
                await visitor.save();

                // VisitorSession Record
                const sessionId = clientSessionId || socket.id;
                const newSession = await VisitorSession.create({
                    sessionId,
                    companyId,
                    websiteId,
                    visitorId: visitor._id.toString(),
                    pageUrl,
                    ipAddress: ip,
                    browser: browserName,
                    device: deviceType,
                    os: os.name || 'Unknown',
                    country,
                    city,
                    region,
                    sessionStart: new Date(),
                    lastActiveAt: new Date(),
                    durationSeconds: 0,
                    isActive: true
                });

                socket.join(`visitor:${visitor._id}`);
                // socket.join(`company:${companyId}`); // Visitors should NOT join company room. Agents join company room.
                // But we need to emit to company room.

                // Acknowledgment
                if (callback) callback({ status: 'ok', sessionId, visitorId: visitor._id });
                socket.emit('visitor-registered', visitor); // Legacy support

                // Broadcast to Admin/Company
                const sessionWithDetails = { ...newSession.toObject(), visitor };
                io.to(`company:${companyId}`).emit('visitor:joined', sessionWithDetails);
                io.to(`company:${companyId}`).emit('session-created', sessionWithDetails); // Legacy

                // 3. chat:autoOpen
                if (autoOpenTimer) clearTimeout(autoOpenTimer);
                autoOpenTimer = setTimeout(async () => {
                    try {
                        const existingMessages = await Message.countDocuments({ visitorId: visitor._id });
                        if (existingMessages > 0) return;

                        const existingWelcome = await Message.findOne({ 
                            visitorId: visitor._id, 
                            sender: 'system',
                            text: "Hey 👋 Can I help you?"
                        });
                        if (existingWelcome) return;

                        const systemMessage = new Message({
                            companyId,
                            visitorId: visitor._id,
                            sender: 'system',
                            text: "Hey 👋 Can I help you?",
                            type: 'system'
                        });
                        await systemMessage.save();

                        // Emit 'chat:message' as requested
                        const payload = {
                            type: 'system',
                            content: systemMessage.text,
                            timestamp: systemMessage.createdAt
                        };
                        socket.emit('chat:message', payload);
                        
                        // Legacy support
                        io.to(`visitor:${visitor._id}`).emit('new-message', systemMessage);
                        io.to(`company:${companyId}`).emit('new-message', systemMessage);
                    } catch (err) {
                        logger.error(`Error in autoOpen: ${err.message}`);
                    }
                }, 10000);

            } catch (err) {
                logger.error(`Error in visitor:join: ${err.message}`);
                if (callback) callback({ error: 'Internal Server Error' });
            }
        });

        // 2. visitor:heartbeat
        socket.on('visitor:heartbeat', async (data) => {
            try {
                const { error, value } = schemas.visitorHeartbeat.validate(data);
                if (error) return; // Silent fail for heartbeat errors

                const { sessionId } = value;
                const finalSessionId = sessionId || socket.id;

                await VisitorSession.findOneAndUpdate(
                    { sessionId: finalSessionId },
                    { 
                        $inc: { durationSeconds: 1 },
                        $set: { lastActiveAt: new Date() }
                    }
                );
                
                // Emit session update to company room
                const updatedSession = await VisitorSession.findOne({ sessionId: finalSessionId });
                if (updatedSession) {
                     io.to(`company:${updatedSession.companyId}`).emit('session-updated', updatedSession);
                }
            } catch (err) {
                logger.error(`Heartbeat error: ${err.message}`);
            }
        });

        // 4. lead:capture
        socket.on('lead:capture', async (data) => {
            try {
                const { error, value } = schemas.leadCapture.validate(data);
                if (error) {
                    socket.emit('error', { code: 'VALIDATION_FAILED', message: error.message });
                    return;
                }

                const { name, email, phone, visitorId, companyId, chatId } = value;

                // Update Visitor
                await Visitor.findByIdAndUpdate(visitorId, { name, email, phone });

                // Ensure Chat Session
                let chat = await Chat.findOne({ visitorId, status: 'open' });
                if (!chat) {
                    chat = new Chat({
                        chatId: new mongoose.Types.ObjectId().toString(),
                        sessionId: socket.id,
                        companyId,
                        status: 'open',
                        visitorId
                    });
                    await chat.save();
                    
                    const populatedChat = await Chat.findById(chat._id).populate('visitorId');
                    io.to(`company:${companyId}`).emit('chat-created', populatedChat);
                }

                // Create Lead Capture
                const lead = new LeadCapture({
                    name,
                    email,
                    phone,
                    chatId: visitorId, // or chat._id
                    sessionId: socket.id,
                    capturedAt: new Date()
                });
                await lead.save();

                // Confirm to Client
                socket.emit('lead:captured-confirmation', { leadId: lead._id });

                // Broadcast to Admin
                const metrics = await getAggregatedMetrics(companyId);
                io.to(`company:${companyId}`).emit('lead:captured', { lead, metrics });
                io.to(`company:${companyId}`).emit('visitor-updated', await Visitor.findById(visitorId)); // Legacy

            } catch (err) {
                logger.error(`Lead capture error: ${err.message}`);
                socket.emit('error', { code: 'INTERNAL_ERROR', message: 'Failed to capture lead' });
            }
        });

        // Legacy: visitor-message (needed for chat functionality)
        socket.on('visitor-message', async (data) => {
            try {
                const { visitorId, text, companyId, tempId } = data;
                const message = new Message({
                    companyId,
                    visitorId,
                    sender: 'visitor',
                    text
                });
                await message.save();
                
                // Convert to object and attach tempId if present for client-side correlation
                const messageObj = message.toObject();
                if (tempId) {
                    messageObj.tempId = tempId;
                }

                io.to(`company:${companyId}`).emit('new-message', messageObj);
                io.to(`visitor:${visitorId}`).emit('new-message', messageObj);
            } catch (e) { logger.error(e); }
        });

        // Agent Join
        socket.on('agent-join', async (companyId) => {
            socket.join(`company:${companyId}`);
            
            // Send Initial State
            const activeVisitors = await Visitor.find({ companyId, status: 'online' });
            socket.emit('active-visitors', activeVisitors);
            
            const metrics = await getAggregatedMetrics(companyId);
            socket.emit('dashboard:metrics', metrics);
        });

        // Disconnect
        socket.on('disconnect', async () => {
            if (autoOpenTimer) clearTimeout(autoOpenTimer);
            logger.info(`Client disconnected: ${socket.id}`);
            
            // Update Visitor Status
            const visitor = await Visitor.findOne({ socketId: socket.id });
            if (visitor) {
                visitor.status = 'offline';
                visitor.lastSeen = new Date();
                await visitor.save();

                // Close Session
                await VisitorSession.updateMany(
                    { visitorId: visitor._id.toString(), isActive: true },
                    { $set: { isActive: false, lastActiveAt: new Date() } }
                );

                io.to(`company:${visitor.companyId}`).emit('visitor-updated', visitor);
            }
        });
    });
};

// Helper: Aggregated Metrics
async function getAggregatedMetrics(companyId) {
    try {
        const activeVisitors = await Visitor.countDocuments({ companyId, status: 'online' });
        const totalLeads = await LeadCapture.countDocuments({}); // Should be filtered by company if LeadCapture has companyId
        // Calculate Avg Session Duration
        const sessions = await VisitorSession.find({ companyId });
        const totalDuration = sessions.reduce((acc, curr) => acc + (curr.durationSeconds || 0), 0);
        const avgSessionDuration = sessions.length ? Math.round(totalDuration / sessions.length) : 0;

        return { activeVisitors, totalLeads, avgSessionDuration };
    } catch (e) {
        return { activeVisitors: 0, totalLeads: 0, avgSessionDuration: 0 };
    }
}
