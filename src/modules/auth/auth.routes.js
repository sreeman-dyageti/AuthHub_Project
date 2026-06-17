import express from "express";
import { register, login, verifyEmail , logoutUser,  resendVerification } from "./auth.controller.js";
import { authentication} from "../../middleware/authentication.middleware.js";
import {authorize} from "../../middleware/authorization.middleware.js"
import { refreshToken } from "./auth.controller.js";


// Registration router endpoint
const router = express.Router();

router.post('/register',register);

// verify-email endpoint
router.get('/verify-email', verifyEmail);

// resend verify-email endpoint
router.post("/resend-verification", resendVerification);

// Login router endpoint
router.post('/login',login);

// authentication endpoint to verify the JWT
router.get('/profile', authentication,(req, res) => {
    res.json({
      message: 'Protected route accessed',
      user: req.user
    });
  });

// protected routes 
router.get('/admin', authentication, authorize(["admin"]), (req, res) => {
    res.json({
      message: 'Welcome Admin'
    });
  });

// refresh Token
  router.post('/refresh-token',refreshToken);

  router.post('/logout' , authentication,logoutUser);

export default router;