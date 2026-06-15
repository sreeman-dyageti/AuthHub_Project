import bcrypt from 'bcrypt';
import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import { query } from '../../config/db.js';

// custom uid generation
const generateCustomId = (first_name, last_name) => {
  const randomNum = crypto.randomInt(1000, 10000);
  const base = `${first_name.toLowerCase().trim()}_${last_name.toLowerCase().trim()}_${randomNum}`;
  return crypto.createHash('sha256').update(base, 'utf8').digest('hex');
};

// custom Email generation
const generateCustomEmailID = (email) => {
  const base = `${email.toLowerCase().trim()}`;
  return crypto.createHash('sha256').update(base, 'utf8').digest('hex');
};

// user Registration 
export const registerUser = async ({ email, password, first_name, last_name, org_id, role_name}) => {
  // custom email
   const emailHash = generateCustomEmailID(email);
  //check whether the user registered or not
  const userCheck = await query('SELECT user_id FROM users WHERE email = $1', [emailHash]);
  if (userCheck.rows.length > 0) {
    return {
    success: false,
    message: 'Email is already registered.'
  };
  }

  // check whether the organization id existed or not 
    const checkOrg_Id = await query('SELECT org_id  , status FROM organizations WHERE org_id = $1', [org_id]);

    if (checkOrg_Id.rows.length === 0) {
    return {
    success: false,
    message: 'Invalid Organization Id.'
  };
}
const orgStatusCheck  = checkOrg_Id.rows[0];
if(orgStatusCheck.status !== 'ACTIVE'){
  return{
    success : false ,
    message : 'organisation is not verified, please verify the organistion first '
  };
} 

//  check that role is avaliable or not 
const Role = role_name.trim().toLowerCase();

const roleCheck = await query(
  'SELECT role_id FROM roles WHERE LOWER(role_name) = $1',[Role]);

if (roleCheck.rows.length === 0) {
    return {
    success: false,
    message: 'No available Role!'
  };
}

  // salt rounds and pass Hash
  const saltRounds = 10;
  const passwordHash = await bcrypt.hash(password, saltRounds);

  // custom uid
  const customUserId = generateCustomId(first_name, last_name);
  // generate verification token 
  const verificationToken = crypto.randomBytes(32).toString('hex');

  //insert user to the database
 const insertQuery = `
  INSERT INTO users (user_id, email, password_hash, first_name, last_name, role, status, verification_token, verification_token_expires_at)
VALUES($1,$2,$3,$4,$5,$6,FALSE,$7, NOW() + INTERVAL '24 hours')
RETURNING user_id, email, first_name, last_name, role, created_at;`;

  const result = await query(insertQuery,[customUserId, emailHash, passwordHash, first_name, last_name, Role, verificationToken]
);
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
      success: true,
      user: newUser,
      verificationToken
    };
};

// user email verification 
export const verifyUserEmail = async ({ token }) => {

  const result = await query(
    `SELECT user_id, verification_token_expires_at FROM users WHERE verification_token = $1`,
    [token]
  );

  if (result.rows.length === 0) {
    return {
      success: false,
      message: 'Invalid verification token'
    };
  }

  if (
    result.rows[0].verification_token_expires_at <
    new Date()
  ) {
    return {
      success: false,
      message: 'Verification token expired'
    };
  }

  await query(
    `
    UPDATE users
    SET
      status = TRUE,
      verification_token = NULL,
      verification_token_expires_at = NULL
    WHERE user_id = $1
    `,
    [result.rows[0].user_id]
  );

  return {
    success: true,
    message: 'Email verified successfully'
  };
};

// Create a Refresh Token Generator
const generateRefreshToken = (userId) => {
  return jwt.sign(
    { userId },
    process.env.REFRESH_SECRET,
    {
      expiresIn: '15m'
    }
  );
};

// Login verification
export const loginUser = async ({ email, password }) => {

  const generatedUserEmailId = crypto
    .createHash("sha256")
    .update(email.toLowerCase().trim(), "utf8")
    .digest("hex");

  const user = await query(
    "SELECT user_id, password_hash, status, role FROM users WHERE email = $1",
    [generatedUserEmailId]
  );

  if (user.rows.length === 0) {
   return {
    success: false,
    message: 'Invalid Email!'
  };
  }

  if (!user.rows[0].status) {
  return {
    success: false,
    message: 'Please verify your email first'
  };
}

  const isMatch = await bcrypt.compare(
    password,
    user.rows[0].password_hash
  );

  if (!isMatch) {
    return {
    success: false,
    message: 'Invalid Password!'
  };
  }
  
// login JWT Access Token
const accessToken = jwt.sign(
  {
    userId: user.rows[0].user_id,
    role: user.rows[0].role
  },
  process.env.JWT_SECRET,
  {
    expiresIn: '7d'
  }
);

const refreshToken = generateRefreshToken(
  user.rows[0].user_id
);

// save refresh token 
await query(`INSERT INTO refresh_tokens(user_id, refresh_token, expires_at)VALUES($1, $2, NOW() + INTERVAL '7 days')`,
  [user.rows[0].user_id, refreshToken]
);

return {
  success: true,
  data:{
    user_id: user.rows[0].user_id,
    role: user.rows[0].role
  },
  accessToken, 
  refreshToken
};


};