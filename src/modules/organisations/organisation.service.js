import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import { query } from '../../config/db.js';

const generateOrgId = (name, email) => {
  const randomNum = crypto.randomInt(1000, 10000);
  const base = `${name.toLowerCase().trim()}_${email.toLowerCase().trim()}_${randomNum}`;

  return crypto.createHash('sha256').update(base, 'utf8').digest('hex');
};

export const createOrgService = async ({ name, email, domain }) => {
  const existingOrg = await query(
    'SELECT org_id FROM organizations WHERE email = $1',
    [email]
  );

  if (existingOrg.rows.length > 0) {
    throw new Error('Organisation already exists.');
  }

  const orgId = generateOrgId(name, email);
  const verificationToken = jwt.sign(
    {
      orgId,
      purpose: 'ORG_VERIFICATION'
    },
    process.env.JWT_SECRET,
    {
      expiresIn: '15m'
    }
  );

  const insertQuery = `
    INSERT INTO organizations (org_id, name, email, domain, verification_token)
    VALUES ($1, $2, $3, $4, $5)
    RETURNING *;
  `;

  const result = await query(insertQuery, [
    orgId,
    name,
    email,
    domain,
    verificationToken
  ]);

  return {
    organisation: result.rows[0],
    verificationToken
  };
};

export const verifyOrgService = async (token) => {
  const orgResult = await query(
    'SELECT * FROM organizations WHERE verification_token = $1',
    [token]
  );

  if (orgResult.rows.length === 0) {
    throw new Error('Invalid verification token.');
  }

  const organisation = orgResult.rows[0];

  await query(
    `
      UPDATE organizations
      SET status = 'ACTIVE',
          verified_at = NOW(),
          verification_token = NULL
      WHERE org_id = $1
    `,
    [organisation.org_id]
  );

  return {
    message: 'Organisation verified successfully.'
  };
};
