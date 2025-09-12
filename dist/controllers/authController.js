"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.adminUpdatePassword = exports.adminUpdateUser = exports.updateMe = exports.getMe = exports.login = exports.register = void 0;
const User_1 = __importDefault(require("../models/User"));
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const JWT_SECRET = process.env.JWT_SECRET || 'your_jwt_secret';
const register = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { email, password, role } = req.body;
        const existingUser = yield User_1.default.findOne({ email });
        if (existingUser) {
            res.status(400).json({ message: 'User already exists' });
            return;
        }
        const hashedPassword = yield bcryptjs_1.default.hash(password, 10);
        const user = new User_1.default({ email, password: hashedPassword, role });
        yield user.save();
        res.status(201).json({ message: 'User registered successfully' });
    }
    catch (error) {
        res.status(500).json({ message: 'Server error', error });
    }
});
exports.register = register;
const login = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { email, password } = req.body;
        const user = yield User_1.default.findOne({ email });
        // Debug logs for professional troubleshooting
        console.log('Login attempt:', { email, password });
        if (!user) {
            console.log('User not found for email:', email);
            res.status(400).json({ message: 'Invalid credentials' });
            return;
        }
        console.log('User found:', { email: user.email, hash: user.password });
        const isMatch = yield bcryptjs_1.default.compare(password, user.password);
        console.log('Password match:', isMatch);
        if (!isMatch) {
            res.status(400).json({ message: 'Invalid credentials' });
            return;
        }
        const token = jsonwebtoken_1.default.sign({ userId: user._id, role: user.role }, JWT_SECRET, { expiresIn: '1d' });
        res.json({
            token,
            user: {
                id: user._id,
                email: user.email,
                role: user.role
            }
        });
    }
    catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ message: 'Server error', error });
    }
});
exports.login = login;
// Get current user's profile
const getMe = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const user = yield User_1.default.findById(req.user.userId);
        if (!user) {
            res.status(404).json({ message: 'User not found' });
            return;
        }
        const profile = {
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
    }
    catch (error) {
        res.status(500).json({ message: 'Server error', error });
    }
});
exports.getMe = getMe;
// User updates own password and address only
const updateMe = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const user = yield User_1.default.findById(req.user.userId);
        if (!user) {
            res.status(404).json({ message: 'User not found' });
            return;
        }
        const { password, address } = req.body;
        if (password) {
            user.password = yield bcryptjs_1.default.hash(password, 10);
        }
        if (address !== undefined) {
            user.address = address;
        }
        yield user.save();
        res.json({ message: 'Profile updated' });
    }
    catch (error) {
        res.status(500).json({ message: 'Server error', error });
    }
});
exports.updateMe = updateMe;
// Admin updates any user's fields (except password)
const adminUpdateUser = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        if (req.user.role !== 'admin') {
            res.status(403).json({ message: 'Forbidden' });
            return;
        }
        const { id } = req.params;
        const { email, role, phone, workEmail, address, position } = req.body;
        const user = yield User_1.default.findById(id);
        if (!user) {
            res.status(404).json({ message: 'User not found' });
            return;
        }
        if (email !== undefined)
            user.email = email;
        if (role !== undefined)
            user.role = role;
        if (phone !== undefined)
            user.phone = phone;
        if (workEmail !== undefined)
            user.workEmail = workEmail;
        if (address !== undefined)
            user.address = address;
        if (position !== undefined)
            user.position = position;
        yield user.save();
        res.json({ message: 'User updated' });
    }
    catch (error) {
        res.status(500).json({ message: 'Server error', error });
    }
});
exports.adminUpdateUser = adminUpdateUser;
// Admin updates any user's password
const adminUpdatePassword = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
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
        const user = yield User_1.default.findById(id);
        if (!user) {
            res.status(404).json({ message: 'User not found' });
            return;
        }
        user.password = yield bcryptjs_1.default.hash(password, 10);
        yield user.save();
        res.json({ message: 'Password updated' });
    }
    catch (error) {
        res.status(500).json({ message: 'Server error', error });
    }
});
exports.adminUpdatePassword = adminUpdatePassword;
