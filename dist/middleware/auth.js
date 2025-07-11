"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.authenticate = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const JWT_SECRET = process.env.JWT_SECRET || 'your_jwt_secret';
const authenticate = (req, res, next) => {
    const authHeader = req.headers.authorization;
    console.log('Auth middleware - Request URL:', req.url);
    console.log('Auth middleware - Auth header:', authHeader);
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        console.log('Auth middleware - No or invalid auth header');
        res.status(401).json({ message: 'No token provided' });
        return;
    }
    const token = authHeader.split(' ')[1];
    try {
        const decoded = jsonwebtoken_1.default.verify(token, JWT_SECRET);
        console.log('Auth middleware - Token verified successfully for user:', decoded.userId);
        req.user = decoded;
        next();
    }
    catch (err) {
        console.log('Auth middleware - JWT verification failed:', err);
        res.status(401).json({ message: 'Invalid token' });
        return;
    }
};
exports.authenticate = authenticate;
