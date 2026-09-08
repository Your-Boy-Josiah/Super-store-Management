// ===============================================================
//  app.js (Main Server Entry Point)
//  Initializes Express, connects to MongoDB, mounts all global 
//  middlewares, and registers the API route handlers.
// ===============================================================

const express = require('express');
const path = require('path');
const cors = require('cors'); 
const helmet = require('helmet'); // Security Headers
const rateLimit = require('express-rate-limit'); // Brute-force protection
const mongoSanitize = require('express-mongo-sanitize'); // NoSQL Injection protection
require('dotenv').config(); 
const connectDB = require('./Config/Database_Configs'); // MongoDB connection utility

// Import Routers
const ProductRoute = require('./Routes/Products_Routes');
const UserRoute    = require('./Routes/Users_Routes');
const SalesRoute   = require('./Routes/Sales_Routes');
const RestockRoute = require('./Routes/Restocks_Routes');
const ReportRoute  = require('./Routes/Reports_Routes'); // Dashboard
const AccessRoute  = require('./Routes/Access_Routes'); // Admin PIN Generation

// Import Custom Middlewares
const { systemLogger } = require('./Middleware/Loggers');
const { errorHandler } = require('./Middleware/Errors'); // Global Error Handler

const app = express();

// ==============================================================
// GLOBAL SECURITY & MIDDLEWARE
// ==============================================================

// Helmet: Secures HTTP headers and allows cross-origin resource loading for static assets
app.use(helmet({ crossOriginResourcePolicy: { policy: "cross-origin" } }));

// Rate Limiting: Max 100 requests per 15 minutes per IP address
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, 
  max: 100, 
  message: { message: 'Too many requests from this IP, please try again after 15 minutes.' }
});
app.use('/api', limiter); // Apply to all /api routes

// ============================================================
// CORS SECURITY
// Restricts API access so only your approved frontends can talk to it
// ============================================================

const corsOptions = {
  // Added your React Vite ports (5173) so the frontend can securely connect
  origin: ['http://localhost:5173', 'http://127.0.0.1:5173', 'http://localhost:3000', 'http://127.0.0.1:3000'], 
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  credentials: true, 
};
// CORS: Allows frontend connections
app.use(cors(corsOptions));

// Body Parsers
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Data Sanitization: Mutates inputs in place to prevent NoSQL injection
// Avoids overwriting req.query directly, which throws an error on read-only getters
app.use((req, res, next) => {
  if (req.body) mongoSanitize.sanitize(req.body);
  if (req.params) mongoSanitize.sanitize(req.params);
  if (req.query) mongoSanitize.sanitize(req.query);
  next();
});

// System Logger (WARN: Must be mounted before the routes to log all requests)
app.use(systemLogger);

// Serve uploaded files statically so they can be viewed via URL
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// ==============================================================
// CONNECT TO MONGODB
// ==============================================================

connectDB();

// ==============================================================
// MOUNT API ROUTERS
// ==============================================================
app.use('/api/users', UserRoute);
app.use('/api/products', ProductRoute);
app.use('/api/sales', SalesRoute);
app.use('/api/restock', RestockRoute);
app.use('/api/reports', ReportRoute); 
app.use('/api/access', AccessRoute); // Mounted Admin PIN bypass routes

// ==============================================================
// 404 FALLBACK ROUTE
// ==============================================================
app.use((req, res, next) => {
  const error = new Error(`Route Not Found: ${req.originalUrl} does not exist.`);
  res.status(404);
  next(error); // Passes the error down to the Global Error Handler
});

// ==============================================================
// GLOBAL ERROR HANDLER (MUST BE LAST!)
// ==============================================================
app.use(errorHandler);

// ==============================================================
// START THE SERVER
// ==============================================================
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`🚀 Supermarket API is running securely on port ${PORT}`);
});
