import validator from "validator"; 
import { registerUser } from './auth.service.js';

export const register = async (req, res) => {
  try {
    
    const { email, password, first_name, last_name } = req.body;
    // validation
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required.' });
    }

  if (!validator.isEmail(email)) {
    return res.status(400).json({
      error: "Please provide a valid email address",
    });
  }
    
    const result = await registerUser({ email, password, first_name, last_name });
    // send successfully message
    res.status(201).json({
      message: 'User registered successfully. Please verify your email.',
      data: {
        user: result.user,
        verificationToken: result.verificationToken
      }
    });

  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};