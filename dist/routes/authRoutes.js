"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const authController_1 = require("../controllers/authController");
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
router.post('/register', authController_1.register);
router.post('/login', authController_1.login);
router.get('/me', auth_1.authenticate, authController_1.getMe);
router.put('/me', auth_1.authenticate, authController_1.updateMe);
router.put('/admin/user/:id', auth_1.authenticate, authController_1.adminUpdateUser);
router.put('/admin/password/:id', auth_1.authenticate, authController_1.adminUpdatePassword);
exports.default = router;
