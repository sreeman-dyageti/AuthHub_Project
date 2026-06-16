import validator from "validator"; 
import { registerUser } from './auth.service.js';
import { loginUser } from "./auth.service.js";
import {verifyUserEmail} from "./auth.service.js";
import { refreshAccessToken } from './auth.service.js';
import { logoutUser as logoutUserService } from "./auth.service.js";

// registration
export const register = async (req, res) => {
  try {
    const { email, password, first_name, last_name,  org_id, role_name} = req.body;

    // validation
    if (!email || !password?.trim()){
      return res.status(400).json({ error: 'Email and Password are Required' });
    }
    if (password.length < 8){
      return res.status(400).json({ error: 'Password must be at least 8 characters long.'})
    }
    if (!first_name?.trim() || !last_name?.trim()){
      return res.status(400).json({ error: 'first_name and last_name are Required' });
    }

    if (!validator.isEmail(email)) {
      return res.status(400).json({
        error: "Please provide a valid email address",
      });
    }

    if (!org_id?.trim() || !role_name?.trim()) {
      return res.status(400).json({
        error: "Organization ID and Role Name are required"
      });
    }

    const result = await registerUser({ email, password, first_name, last_name, org_id, role_name });

    if (result.needsVerification) {
      return res.status(200).json({
        message: result.message,
      });
    }

     if (!result.success) {
    return res.status(400).json({
    error: result.message
    });
   }  
    // send successfully message
    res.status(201).json({
      message: 'User registered successfully. Verification email sent.',
      data: {
        user: result.user,
      }
    });

  } catch (error) {
   return res.status(400).json({ error: error.message });
  }
};

// Verify registration using JWT session
export const verifyEmail = async (req, res) => {
    try {
      const {token} = req.query
      
      if (!token){
        return res.status(400).json({
          error: 'Token requied!'
        });
      }

      const result = await verifyUserEmail(token);
      if (!result.success){
        return res.status(400).json({
          error: result.message
        })
      }

      return res.status(200).json({
        message: result.message
      })

    } catch (error) {
      return res.status(500).json({
        error: error.message
      })    
    }
}

// Login
export const login = async (req, res) => {
  try {
      const {email, password} = req.body;
      // validation
      if (!email || !password.trim()){
        return res.status(400).json({error: 'email and password are required'});
      }

      if (!validator.isEmail(email)) {
        return res.status(400).json({
         error: "Please provide a valid email address",
      });
  }

  const result = await loginUser({ email, password }); 
   if (!result.success) {
    return res.status(400).json({
      error: result.message
    });
  }
    return res.status(200).json({
      message: 'Login Successful!',
      data: result.data,
      accessToken: result.accessToken,
      refreshToken: result.refreshToken
    });

  } catch (error) {
   return res.status(500).json({ error: error.message });
}

}

// refresh Token
export const refreshToken = async (req, res) => {

  const { refreshToken } = req.body;

  if (!refreshToken) {
    return res.status(400).json({
      error: 'Refresh token required'
    });
  }

  const result = await refreshAccessToken({
    refreshToken
  });

  if (!result.success) {
    return res.status(401).json({
      error: result.message
    });
  }

  return res.status(200).json({
    accessToken: result.accessToken
  });

};

// logout validation 
export const logoutUser = async (req, res) => {
  try {
    const { refreshToken } = req.body;
    const result = await logoutUserService({
      refreshToken,
      userId: req.user.userId,
    });

    if (!result.success) {
      return res.status(400).json({
        error: result.message,
      });
    }

    return res.status(200).json({
      message: result.message,
    });
  } catch (error) {
    return res.status(500).json({
      error: error.message,
    });
  }
};