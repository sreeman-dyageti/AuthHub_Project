import dotenv from 'dotenv';
import express from 'express';
import { query } from './config/db.js'; 

dotenv.config();

const app = express();

// Middleware for JSON requests
app.use(express.json()); 

const PORT = process.env.PORT || 8080;

app.listen(PORT, async () => {
  console.log(`AuthHub Server is running on port ${PORT}`);
  
  try {
    const res = await query('SELECT NOW()');
    console.log('Database connected successfully! Current DB time:', res.rows[0].now);
  } catch (err) {
    console.error('Database connection failed. Check your .env file.', err);
  }
});