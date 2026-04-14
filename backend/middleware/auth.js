/**
 * JWT Authentication Middleware
 * 
 * Verifies JWT tokens from the Authorization header.
 * Attaches decoded user data to req.user for downstream handlers.
 * 
 * Usage:
 *   const auth = require('../middleware/auth');
 *   router.get('/protected', auth, (req, res) => { ... });
 */

const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'smartmgmt_secret_key_2024';

/**
 * Authentication middleware.
 * Expects: Authorization: Bearer <token>
 */
function authMiddleware(req, res, next) {
    // Get token from header
    const authHeader = req.headers['authorization'];
    
    if (!authHeader) {
        return res.status(401).json({ 
            error: 'Access denied. No token provided.',
            status: 'unauthorized'
        });
    }

    // Extract token (remove "Bearer " prefix)
    const token = authHeader.startsWith('Bearer ') 
        ? authHeader.slice(7) 
        : authHeader;

    if (!token) {
        return res.status(401).json({ 
            error: 'Access denied. Invalid token format.',
            status: 'unauthorized'
        });
    }

    try {
        // Verify and decode token
        const decoded = jwt.verify(token, JWT_SECRET);
        req.user = decoded;  // { id, email, role }
        next();
    } catch (err) {
        if (err.name === 'TokenExpiredError') {
            return res.status(401).json({ 
                error: 'Token expired. Please login again.',
                status: 'token_expired'
            });
        }
        return res.status(403).json({ 
            error: 'Invalid token.',
            status: 'forbidden'
        });
    }
}

/**
 * Role-based authorization middleware.
 * Must be used AFTER authMiddleware.
 * 
 * Usage:
 *   router.delete('/admin-only', auth, authorize('admin'), handler);
 *   router.put('/managers', auth, authorize('admin', 'manager'), handler);
 */
function authorize(...roles) {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({ 
                error: 'Authentication required.',
                status: 'unauthorized'
            });
        }

        if (!roles.includes(req.user.role)) {
            return res.status(403).json({ 
                error: `Access denied. Required role: ${roles.join(' or ')}`,
                status: 'forbidden'
            });
        }

        next();
    };
}

module.exports = authMiddleware;
module.exports.authorize = authorize;
module.exports.JWT_SECRET = JWT_SECRET;
