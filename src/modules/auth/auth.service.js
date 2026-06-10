import bcrypt from 'bcrypt';
import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import { query } from '../../config/db.js';

// custom uid generation
const generateCustomId = (firstName, lastName) => {
  const randomNum = crypto.randomInt(1000, 10000);
  const base = `${firstName.toLowerCase().trim()}_${lastName.toLowerCase().trim()}_${randomNum}`;
  return crypto.createHash('sha256').update(base, 'utf8').digest('hex');
};


export const registerUser = async ({ email, password, first_name, last_name }) => {
    
  //check whether the user registered or not
  const userCheck = await query('SELECT user_id FROM users WHERE email = $1', [email]);
  if (userCheck.rows.length > 0) {
    throw new Error('Email is already registered.');
  }

  // salt rounds and pass Hash
  const saltRounds = 10;
  const passwordHash = await bcrypt.hash(password, saltRounds);

  // custom uid
  const customUserId = generateCustomId(first_name, last_name);

  //insert user to the database
 const insertQuery = `
  INSERT INTO users (user_id, email, password_hash, first_name, last_name)
  VALUES ($1, $2, $3, $4, $5)
  RETURNING user_id, email, first_name, last_name, created_at;
`;

  const result = await query(insertQuery, [customUserId, email, passwordHash, first_name, last_name]);
  const newUser = result.rows[0];

  //Generate the 15-minute Verification JWT
  const verificationToken = jwt.sign(
    { 
      userId: newUser.id,
      purpose: 'EMAIL_VERIFICATION' 
    },
    process.env.JWT_SECRET,
    { expiresIn: '15m' }
  );

  return {
    user: newUser,
    verificationToken
  };
};
