import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { query } from '../../config/db.js';

export const registerUser = async ({ email, password, firstName, lastName }) => {
    
  //check whether the user registered or not
  const userCheck = await query('SELECT id FROM users WHERE email = $1', [email]);
  if (userCheck.rows.length > 0) {
    throw new Error('Email is already registered.');
  }

  // salt rounds and pass Hash
  const saltRounds = 10;
  const passwordHash = await bcrypt.hash(password, saltRounds);

  //insert user to the database
  const insertQuery = `
    INSERT INTO users (email, password, first_name, last_name)
    VALUES ($1, $2, $3, $4, 'PENDING_VERIFICATION')
    RETURNING id, email, first_name, last_name, status, created_at;
  `;
};