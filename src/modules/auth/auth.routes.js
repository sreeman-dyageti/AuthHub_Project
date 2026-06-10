import express from "express";
import { register, login } from "./auth.controller.js";

// Registration ro
const router = express.Router();

router.post('/register',register);

// Login router
router.post('/login',login);

export default router;

