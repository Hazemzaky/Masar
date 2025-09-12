import { Request, Response } from 'express';
import User from '../models/User';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'your_jwt_secret';

export const register = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password, role } = req.body;
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      res.status(400).json({ message: 'User already exists' });
      return;
    }
    const hashedPassword = await bcrypt.hash(password, 10);
    const user = new User({ email, password: hashedPassword, role });
    await user.save();
    res.status(201).json({ message: 'User registered successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
};

export const login = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });

    // Debug logs for professional troubleshooting
    console.log('Login attempt:', { email, password });
    if (!user) {
      console.log('User not found for email:', email);
      res.status(400).json({ message: 'Invalid credentials' });
      return;
    }
    console.log('User found:', { email: user.email, hash: user.password });

    const isMatch = await bcrypt.compare(password, user.password);
    console.log('Password match:', isMatch);

    if (!isMatch) {
      res.status(400).json({ message: 'Invalid credentials' });
      return;
    }
    const token = jwt.sign(
      { userId: user._id, role: user.role },
      JWT_SECRET,
      { expiresIn: '1d' }
    );
    res.json({
      token,
      user: {
        id: user._id,
        email: user.email,
        role: user.role
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Server error', error });
  }
};

// Get current user's profile
export const getMe = async (req: any, res: Response): Promise<void> => {
  try {
    const user = await User.findById(req.user.userId);
    if (!user) {
      res.status(404).json({ message: 'User not found' });
      return;
    }
    const profile: any = {
      _id: user._id,
      email: user.email,
      role: user.role,
      position: user.position || undefined,
      phone: user.phone,
      workEmail: user.workEmail,
      address: user.address,
      lastSignIn: user.lastSignIn,
    };
    // Only admin or self can see password (masked)
    if (req.user.role === 'admin' || req.user.userId === String(user._id)) {
      profile.password = '********';
    }
    res.json(profile);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
};

// User updates own password and address only
export const updateMe = async (req: any, res: Response): Promise<void> => {
  try {
    const user = await User.findById(req.user.userId);
    if (!user) {
      res.status(404).json({ message: 'User not found' });
      return;
    }
    const { password, address } = req.body;
    if (password) {
      user.password = await bcrypt.hash(password, 10);
    }
    if (address !== undefined) {
      user.address = address;
    }
    await user.save();
    res.json({ message: 'Profile updated' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
};

// Admin updates any user's fields (except password)
export const adminUpdateUser = async (req: any, res: Response): Promise<void> => {
  try {
    if (req.user.role !== 'admin') {
      res.status(403).json({ message: 'Forbidden' });
      return;
    }
    const { id } = req.params;
    const { email, role, phone, workEmail, address, position } = req.body;
    const user = await User.findById(id);
    if (!user) {
      res.status(404).json({ message: 'User not found' });
      return;
    }
    if (email !== undefined) user.email = email;
    if (role !== undefined) user.role = role;
    if (phone !== undefined) user.phone = phone;
    if (workEmail !== undefined) user.workEmail = workEmail;
    if (address !== undefined) user.address = address;
    if (position !== undefined) user.position = position;
    await user.save();
    res.json({ message: 'User updated' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
};

// Admin updates any user's password
export const adminUpdatePassword = async (req: any, res: Response): Promise<void> => {
  try {
    if (req.user.role !== 'admin') {
      res.status(403).json({ message: 'Forbidden' });
      return;
    }
    const { id } = req.params;
    const { password } = req.body;
    if (!password) {
      res.status(400).json({ message: 'Password required' });
      return;
    }
    const user = await User.findById(id);
    if (!user) {
      res.status(404).json({ message: 'User not found' });
      return;
    }
    user.password = await bcrypt.hash(password, 10);
    await user.save();
    res.json({ message: 'Password updated' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
}; 