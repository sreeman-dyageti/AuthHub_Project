import express from "express";
import { register, login, verifyEmail } from "./auth.controller.js";

// Registration router endpoint
const router = express.Router();

router.post('/register',register);

// verify-email endpoint
router.get('/verify-email', verifyEmail);

// Login router endpoint
router.post('/login',login);

export default router;

