require('dotenv').config();
const express = require('express');
const http = require('http');
const mongoose = require('mongoose');
const cors = require('cors');
const { Server } = require('socket.io');
const { createAdapter } = require('@socket.io/redis-adapter');
const { createClient } = require('redis');
const client = require('prom-client');
const logger = require('./utils/logger');

// Import Routes
const chatRoutes = require('./routes/chatRoutes');
const faqRoutes = require('./routes/faqRoutes');
const articleRoutes = require('./routes/articleRoutes');
const visitorRoutes = require('./routes/visitorRoutes');
const leadRoutes = require('./routes/leadRoutes');

// Import Socket Handler
const socketHandler = require('./socket/socketHandler');

const app = express();

// Security: CORS & Headers
const allowedOrigins = process.env.ALLOWED_ORIGINS ? process.env.ALLOWED_ORIGINS.split(',') : ['http://localhost:3000', 'http://localhost:3001'];
app.use(cors({
    origin: function (origin, callback) {
        // Allow requests with no origin (like mobile apps or curl requests)
        if (!origin) return callback(null, true);
        if (allowedOrigins.indexOf(origin) === -1 && origin !== "*") { // * for dev
            return callback(null, true); // Permissive for dev, restrict in prod
        }
        return callback(null, true);
    },
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    credentials: true
}));

app.use(express.json());
app.use(express.static('public'));

// Prometheus Metrics
const collectDefaultMetrics = client.collectDefaultMetrics;
collectDefaultMetrics({ register: client.register });

app.get('/metrics', async (req, res) => {
    res.set('Content-Type', client.register.contentType);
    res.end(await client.register.metrics());
});

// HTTP Server
const server = http.createServer(app);

// Redis Client for Socket.io Adapter
const pubClient = createClient({ url: process.env.REDIS_URL || 'redis://localhost:6379' });
const subClient = pubClient.duplicate();

// Socket.io Setup
const io = new Server(server, {
    cors: {
        origin: "*", // Adjust for production
        methods: ["GET", "POST"]
    }
});

// Async Redis Connect & Adapter Init
Promise.all([pubClient.connect(), subClient.connect()]).then(() => {
    io.adapter(createAdapter(pubClient, subClient));
    logger.info('Redis Adapter connected');
}).catch(err => {
    logger.error('Redis Connection Error (Socket.io will fallback to memory): ' + err.message);
});

app.set('socketio', io);

// Request Logging Middleware
app.use((req, res, next) => {
    logger.info(`${req.method} ${req.url}`);
    next();
});

// MongoDB Connection
mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/salesiq')
    .then(() => logger.info('MongoDB Connected'))
    .catch(err => logger.error('MongoDB Connection Error: ' + err.message));

// Register Routes
app.get('/', (req, res) => {
    res.send('SalesIQ Backend Running');
});

app.use('/api/chats', chatRoutes);
app.use('/api/faqs', faqRoutes);
app.use('/api/articles', articleRoutes);
app.use('/api/visitors', visitorRoutes);
app.use('/api/leads', leadRoutes);

// Error Handling Middleware
app.use((err, req, res, next) => {
    logger.error(err.stack);
    res.status(500).send('Something broke!');
});

// Initialize Socket Logic
socketHandler(io);

// Graceful Shutdown
const gracefulShutdown = () => {
    logger.info('Received kill signal, shutting down gracefully');
    server.close(() => {
        logger.info('Closed out remaining connections');
        mongoose.connection.close(false, () => {
            logger.info('MongoDB connection closed');
            process.exit(0);
        });
    });
};

process.on('SIGTERM', gracefulShutdown);
process.on('SIGINT', gracefulShutdown);

const PORT = process.env.PORT || 5001;
server.listen(PORT, () => {
    logger.info(`Server running on port ${PORT}`);
});
