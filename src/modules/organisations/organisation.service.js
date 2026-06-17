import crypto from "crypto";
import jwt from "jsonwebtoken";
import { query } from "../../config/db.js";
import { sendOrganizationVerificationEmail } from "../../modules/service/email.service.js";

const generateOrgId = (name) => {
  const cleanName = name.replace(/\s+/gi, "");
  const firstName = cleanName.slice(0, 3);
  const lastName = cleanName.slice(-3);
  const randomNum = crypto.randomInt(1000, 9999);
  return `ORG_${firstName}${lastName}_${randomNum}`;
};
const generateOrgVerificationToken = (orgId) => {
  return jwt.sign(
    {
      orgId,
      purpose: "ORG_VERIFICATION",
    },
    process.env.JWT_SECRET,
    {
      expiresIn: "15m",
    },
  );
};

export const createOrgService = async ({ name, email, domain }) => {
  const existingOrg = await query(
    "SELECT org_id, status FROM organizations WHERE LOWER(email) = LOWER($1) OR LOWER(domain) = LOWER($2) LIMIT 1",
    [email, domain],
  );
  if (existingOrg.rows.length > 0) {
    const organisation = existingOrg.rows[0];
    if (organisation.status === "ACTIVE") {
      return {
        success: false,
        alreadyExists: true,
        message: "organisation already exists ",
      };
    }
    const verificationToken = generateOrgVerificationToken(organisation.org_id);
    const updateResult = await query(
      "UPDATE organizations SET verification_token = $1 WHERE org_id = $2 RETURNING org_id , name , email , domain , status , created_at",
      [verificationToken, organisation.org_id],
    );
 await sendOrganizationVerificationEmail(updateResult.rows[0].email, verificationToken);
    return {
      success: true,
      verificationResent: true,
      message:
        "organisation already exists but it is not verified ,new verification token generated ",
      organisation: updateResult.rows[0]
    };
  }

  const orgId = generateOrgId(name);
  const verificationToken = generateOrgVerificationToken(orgId);
  const insertQuery =
    "INSERT INTO organizations( org_id , name , email , domain , verification_token ) VALUES ($1,$2,$3,$4,$5) RETURNING org_id , name , email , domain , status , created_at;";
  const result = await query(insertQuery, [
    orgId,
    name,
    email,
    domain,
    verificationToken,
  ]);
 
  await sendOrganizationVerificationEmail(email, verificationToken);

  return {
    success: true,
    organisation: result.rows[0],
  };
};

export const verifyOrgService = async (token) => {
  try {

    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET
    );

    if (decoded.purpose !== "ORG_VERIFICATION") {
      return {
        success: false,
        message: "Invalid verification token"
      };
    }

    const orgResult = await query(
      "SELECT * FROM organizations WHERE verification_token = $1",
      [token]
    );

    if (orgResult.rows.length === 0) {
      return {
        success: false,
        message: "Invalid verification token"
      };
    }

    const organisation = orgResult.rows[0];

    const updateResult = await query(` UPDATE organizations SET status = 'ACTIVE', verified_at = NOW(), verification_token = NULL
      WHERE org_id = $1 RETURNING org_id, name, email, domain, status, verified_at
      `,[organisation.org_id]
    );

    if (updateResult.rows.length === 0) {
      return {
        success: false,
        message: "Failed to verify organisation"
      };
    }

    return {
      success: true,
      message: "Organisation verified successfully.",
      organisation: updateResult.rows[0]
    };

  } catch (error) {

    return {
      success: false,
      message: "Verification token expired or invalid"
    };

  }
};

export const resendVerificationService = async (email) => {

  const orgResult = await query(
    `SELECT org_id, name, email, status
    FROM organizations
    WHERE LOWER(email) = LOWER($1)`,
    [email]
  );

  if (orgResult.rows.length === 0) {
    return {
      success: false,
      message: "Organisation not found"
    };
  }

  const organisation = orgResult.rows[0];

  if (organisation.status === "ACTIVE") {
    return {
      success: false,
      message: "Organisation is already verified and active"
    };
  }

  const verificationToken =
    generateOrgVerificationToken(
      organisation.org_id
    );

  const reverifedData = await query(
    ` UPDATE organizations SET verification_token = $1 WHERE org_id = $2
    RETURNING org_id, name, email, domain, status`,
    [verificationToken, organisation.org_id]
  );

  if (reverifedData.rows.length === 0) {
    return {
      success: false,
      message: "Re-verification failed"
    };
  }

  await sendOrganizationVerificationEmail(organisation.email, verificationToken );

  return {
    success: true,
    verificationSent: true,
    message: "Verification email sent successfully",
    organisation: reverifedData.rows[0]
  };
};