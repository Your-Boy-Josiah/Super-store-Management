// ============================================================
//  Database_Configuration
//  Handles the connection to the MongoDB.
//  Imported and executed in the main server.
// ============================================================

const PM = require('mongoose');

const connectDB = async () => {
  try {
    // Tell Mongoose (PM) to connect using the URL from your .env file
    const connection = await PM.connect(process.env.MONGO_URI);
    
    // Log a success message so you know it worked when the server starts
    console.log(`MongoDB Connected: ${connection.connection.host}`);
  } catch (error) {
    // If the connection fails, log the error and kill the server
    console.error('Error connecting to MongoDB:', error.message);
    process.exit(1); 
  }     
};

// Export the function so app.js can trigger it on startup
module.exports = connectDB;