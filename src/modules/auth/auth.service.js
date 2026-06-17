import bcrypt from "bcrypt";
import crypto from "crypto";
import jwt from "jsonwebtoken";
import { query } from "../../config/db.js";
import { sendVerificationEmail } from "../../modules/service/email.service.js";
import { createAuditLogs } from "../audit/audit.service.js";

// Custom User ID Generation
const generateCustomId = (first_name, last_name) => {
  const randomNum = crypto.randomInt(1000, 10000);
  const base = `${first_name.toLowerCase().trim()}_${last_name.toLowerCase().trim()}_${randomNum}`;

  return crypto.createHash("sha256").update(base, "utf8").digest("hex");
};

// User Verification JWT
const generateUserVerificationToken = (userId) => {
  return jwt.sign(
    {
      userId,
      purpose: "EMAIL_VERIFICATION",
    },
    process.env.JWT_SECRET,
    {
      expiresIn: "15m",
    },
  );
};

// Register User
export const registerUser = async ({
  email,
  password,
  first_name,
  last_name,
  org_id,
  role_name,
}) => {
  const normalizedEmail = email.toLowerCase().trim();
  // Check Existing User
  const userCheck = await query("SELECT user_id FROM users WHERE email = $1", [
    normalizedEmail,
  ]);

  if (userCheck.rows.length > 0) {
    return {
      success: false,
      message: "Email is already registered.",
    };
  }

  // Check Organization
  const orgCheck = await query(
    "SELECT org_id, status FROM organizations WHERE org_id = $1",
    [org_id],
  );

  if (orgCheck.rows.length === 0) {
    return {
      success: false,
      message: "Invalid Organization Id.",
    };
  }

  if (orgCheck.rows[0].status !== "ACTIVE") {
    return {
      success: false,
      message:
        "Organisation is not verified. Please verify the organisation first.",
    };
  }

  // Check Role
  const role = role_name.trim().toLowerCase();

  const roleCheck = await query(
    "SELECT role_id FROM roles WHERE LOWER(role_name) = $1",
    [role],
  );

  if (roleCheck.rows.length === 0) {
    return {
      success: false,
      message: "No available role.",
    };
  }

  // Password Hash
  const passwordHash = await bcrypt.hash(password, 10);

  // User ID
  const userId = generateCustomId(first_name, last_name);

  // Insert User
  const result = await query(
    `INSERT INTO users(user_id, email, password_hash, first_name, last_name, role, status)
    VALUES ($1,$2,$3,$4,$5,$6,FALSE) RETURNING user_id, email, first_name, last_name, role, created_at`,
    [userId, normalizedEmail, passwordHash, first_name, last_name, role],
  );

  const newUser = result.rows[0];
  console.log("Role Check:", roleCheck.rows[0]);
  console.log("User ID:", userId);
  console.log("Org ID:", org_id);
  try {
    const authorityResult = await query(
      `
    INSERT INTO user_authority (
      user_id,
      org_id,
      role_id,
      status
    )
    VALUES ($1, $2, $3, $4)
    RETURNING *
    `,
      [userId, org_id, roleCheck.rows[0].role_id, "ACTIVE"],
    );

    console.log("User Authority Created:", authorityResult.rows[0]);
  } catch (error) {
    console.error("User Authority Insert Failed:", error);
  }

  // Generate JWT Verification Token
  const verificationToken = generateUserVerificationToken(userId);

  // Save Token
  await query(`UPDATE users SET verification_token = $1 WHERE user_id = $2`, [
    verificationToken,
    userId,
  ]);

  // Send Email
  try {
    await sendVerificationEmail(normalizedEmail, verificationToken);
  } catch (error) {
    console.error("Email sending failed:", error);
  }

  return {
    success: true,
    user: newUser,
  };
};

// Verify Email
export const verifyUserEmail = async (token) => {
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    if (decoded.purpose !== "EMAIL_VERIFICATION") {
      return {
        success: false,
        message: "Invalid verification token",
      };
    }

    const result = await query(
      `SELECT user_id FROM users WHERE verification_token = $1`,
      [token],
    );

    if (result.rows.length === 0) {
      return {
        success: false,
        message: "Invalid verification token",
      };
    }

    await query(
      ` UPDATE users SET status = TRUE, verification_token = NULL WHERE user_id = $1`,
      [result.rows[0].user_id],
    );

    return {
      success: true,
      message: "Email verified successfully",
    };
  } catch (error) {
    return {
      success: false,
      message: "Verification token expired or invalid",
    };
  }
};

// resend verification email
export const resendVerificationEmail = async ({ email }) => {
  const normalizedEmail = email.toLowerCase().trim();

  const userResult = await query(
    `SELECT user_id, status FROM users WHERE email = $1`,
    [normalizedEmail],
  );

  if (userResult.rows.length === 0) {
    return {
      success: false,
      message: "user not found!",
    };
  }

  const user = userResult.rows[0];
  if (user.status === true) {
    return {
      success: false,
      message: "your email already verified!",
    };
  }

  const verificationToken = generateUserVerificationToken(user.user_id);

  await query(`UPDATE users SET verification_token = $1 WHERE user_id = $2`, [
    verificationToken,
    user.user_id,
  ]);

  await sendVerificationEmail(normalizedEmail, verificationToken);

  return {
    success: true,
    message: "Verification email sent successfully",
  };
};

// Refresh Token Generator
const generateRefreshToken = (userId) => {
  return jwt.sign({ userId }, process.env.REFRESH_SECRET, {
    expiresIn: "7d",
  });
};

// Login
export const loginUser = async ({ email, password }) => {
  const normalizedEmail = email.toLowerCase().trim();

  const user = await query(
    `SELECT u.user_id , u.email , u.password_hash , u.status , ua.org_id , r.role_name FROM users u INNER JOIN user_authority ua ON ua.user_id = u.user_id INNER JOIN roles r ON r.role_id = ua.role_id WHERE LOWER(u.email) = LOWER($1)`,
    [normalizedEmail],
  );
  console.log("LOGIN QUERY RESULT:", user.rows);

  if (user.rows.length === 0) {
    return {
      success: false,
      message: "Invalid Email!",
    };
  }

  if (!user.rows[0].status) {
    return {
      success: false,
      message: "Please verify your email first.",
    };
  }

  const isMatch = await bcrypt.compare(password, user.rows[0].password_hash);

  if (!isMatch) {
    return {
      success: false,
      message: "Invalid Password!",
    };
  }

  // login JWT access Token
  const accessToken = jwt.sign(
    {
      userId: user.rows[0].user_id,
      role: user.rows[0].role_name,
    },
    process.env.JWT_SECRET,
    {
      expiresIn: "15m",
    },
  );

  const refreshToken = generateRefreshToken(user.rows[0].user_id);

  await query(
    `INSERT INTO refresh_tokens( user_id, refresh_token, expires_at)
    VALUES($1,$2,NOW() + INTERVAL '7 days')`,
    [user.rows[0].user_id, refreshToken],
  );
  await createAuditLogs({
    user_id: user.rows[0].user_id,
    org_id: user.rows[0].org_id,
    email: user.rows[0].email,
    role_name: user.rows[0].role_name,
    action: "LOGIN",
  });

  return {
    success: true,
    data: {
      user_id: user.rows[0].user_id,
      org_id: user.rows[0].org_id,
      role: user.rows[0].role_name,
    },
    accessToken,
    refreshToken,
  };
};

// generate new refresh token
export const refreshAccessToken = async ({ refreshToken }) => {
  try {
    const decoded = jwt.verify(refreshToken, process.env.REFRESH_SECRET);

    const tokenRecord = await query(
      `SELECT user_id FROM refresh_tokens WHERE refresh_token = $1`,
      [refreshToken],
    );

    if (tokenRecord.rows.length === 0) {
      return {
        success: false,
        message: "Invalid refresh token",
      };
    }

    const user = await query(
      `SELECT user_id, role FROM users WHERE user_id = $1`,
      [decoded.userId],
    );

    if (user.rows.length === 0) {
      return {
        success: false,
        message: "User not found",
      };
    }
    const newAccessToken = jwt.sign(
      {
        userId: user.rows[0].user_id,
        role: user.rows[0].role,
      },
      process.env.JWT_SECRET,
      {
        expiresIn: "15m",
      },
    );

    return {
      success: true,
      accessToken: newAccessToken,
    };
  } catch (error) {
    return {
      success: false,
      message: "Invalid or expired refresh token",
    };
  }
};

// logout
export const logoutUser = async ({ refreshToken, userId }) => {
  if (!refreshToken) {
    return {
      success: false,
      message: "Refresh token required",
    };
  }

  try {
    const decoded = jwt.verify(refreshToken, process.env.REFRESH_SECRET);

    if (decoded.userId !== userId) {
      return {
        success: false,
        message: "Invalid refresh token",
      };
    }
  } catch (error) {
    return {
      success: false,
      message: "Invalid or expired refresh token",
    };
  }

  const deletedToken = await query(
    `DELETE FROM refresh_tokens WHERE refresh_token = $1 AND user_id = $2 RETURNING refresh_token`,
    [refreshToken, userId],
  );

  if (deletedToken.rows.length === 0) {
    return {
      success: false,
      message: "Session not found",
    };
  }

  return {
    success: true,
    message: "Logged out successfully",
  };
};
