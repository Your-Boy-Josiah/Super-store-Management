// ===============================================================
//  Authentication (Middleware)
//  Verifies the JSON Web Token (JWT) sent by the client.
//  Ensures the user is securely logged in before they can 
//  access any protected API routes.
// ===============================================================

const jwt = require('jsonwebtoken');

// ==============================================================
// VERIFY TOKEN FUNCTION
// ==============================================================

exports.verifyToken = (req, res, next) => {
  try {
    // Look for the token in the HTTP Authorization header
    // Standard format is: "Bearer <token>"
    const authHeader = req.headers.authorization;
    
    // Check if the header exists and is formatted correctly
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'Access denied. No token provided.' });
    }

    // Extract just the token string (remove the word "Bearer ")
    const token = authHeader.split(' ')[1];

    // Verify the token using the secret key in your .env file
    // If the token was tampered with or is fake, this will throw an error
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Attach the decoded payload to the request object
    // Now, EVERY controller that runs after this has access to .id and .role
    req.user = decoded;

    // 6. If the Token is valid, move on to the next function 
    next();

  } catch (error) {
    // Handle specific JWT errors gracefully
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ message: 'Session expired. Please log in again.' });
    }
    
    // Handle fake, altered, or malformed tokens
    return res.status(403).json({ message: 'Invalid or malformed token.' });
  }
};
