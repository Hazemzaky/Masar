import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'your_jwt_secret';

export interface AuthRequest extends Request {
  user?: { userId: string; role: string };
}

export const authenticate = (req: AuthRequest, res: Response, next: NextFunction): void => {
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
    const decoded = jwt.verify(token, JWT_SECRET) as { userId: string; role: string };
    console.log('Auth middleware - Token verified successfully for user:', decoded.userId);
    req.user = decoded;
    next();
  } catch (err) {
    console.log('Auth middleware - JWT verification failed:', err);
    res.status(401).json({ message: 'Invalid token' });
    return;
  }
};