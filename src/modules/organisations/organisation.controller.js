import validator from "validator";
import {
  createOrgService, verifyOrgService,
  resendVerificationService,
} from "./organisation.service.js";
import isEmail from "validator/lib/isEmail.js";

export const createOrg = async (req, res) => {
  try {
    const { name, email, domain } = req.body;

    const errors = [];
    if (!name || name.trim() === "") {
      errors.push("organisation name is required");
    }
    if (!email || email.trim() === "") {
      errors.push("organisation email are required");
    }
    if (!domain || domain.trim() === "") {
      errors.push("organisation domain are required");
    }
    if (email && !validator.isEmail(email)) {
      errors.push("Invalid email format ");
    }
    if (errors.length > 0) {
      return res.status(400).json({
        success: false,
        errors,
      });
    }

    const result = await createOrgService({ name, email, domain });
    if (result.alreadyExists) {
      return res.status(409).json({
        success: false,
        message: result.message,
      });
    }
    if (result.verificationResent) {
      return res.status(200).json({
        success: true,
        message: result.message,
        data: result,
      });
    }
    return res.status(201).json({
      message:"Organisation created successfully. Verification email sent.",
      data: result,
    });
  } catch (error) {
    console.error("CREATE ORG ERROR:", error);

    res.status(400).json({
      error: error.message,
    });
  }
};
export const verifyOrg = async (req, res) => {
  try {
    const { token } = req.query;
    const result = await verifyOrgService(token);
    return res.status(200).json(result);
  } catch (error) {
    console.error("VERIFY ORG ERROR:", error);

    res.status(400).json({
      error: error.message,
    });
  }
};

export const resendVerification = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({
        success: false,
        message: "organisation email is required",
      });
    }
    const result = await resendVerificationService(email);
    if (!result.success) {
      return res.status(400).json(result);
    }
    return res.status(200).json(result);
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};