import bcrypt from 'bcrypt';
import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import { query } from '../../config/db.js';
import { error } from 'console';
import { parse } from 'path';

// custom uid generation
const generateCustomId = (first_name, last_name) => {
  const randomNum = crypto.randomInt(1000, 10000);
  const base = `${first_name.toLowerCase().trim()}_${last_name.toLowerCase().trim()}_${randomNum}`;
  return crypto.createHash('sha256').update(base, 'utf8').digest('hex');
};

// custom Email generation
const generateCustomEmailID = (email) => {
  const base = `${email.toLowerCase()}`;
  return crypto.createHash('sha256').update(base, 'utf8').digest('hex');
};

// user Registration 
export const registerUser = async ({ email, password, first_name, last_name }) => {
  // custom email
   const emailHash = generateCustomEmailID(email);
  //check whether the user registered or not
  const userCheck = await query('SELECT user_id FROM users WHERE email = $1', [emailHash]);
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

  const result = await query(insertQuery, [customUserId, emailHash, passwordHash, first_name, last_name]);
  const newUser = result.rows[0];

  //Generate the 15-minute Verification JWT
  const verificationToken = jwt.sign(
    { 
      userId: newUser.user_id,
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

// Login verification
export const loginUser = async ({ email, password }) => {

  const generatedUserEmailId = crypto
    .createHash("sha256")
    .update(email.toLowerCase().trim(), "utf8")
    .digest("hex");

  const user = await query(
    "SELECT user_id, password_hash FROM users WHERE email = $1",
    [generatedUserEmailId]
  );

  if (user.rows.length === 0) {
    throw new Error("Invalid Email");
  }

  const isMatch = await bcrypt.compare(
    password,
    user.rows[0].password_hash
  );

  if (!isMatch) {
    throw new Error("Invalid Password");
  }

  return user.rows[0];
};