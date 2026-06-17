import crypto from "crypto";
import jwt from "jsonwebtoken";
import { query } from "../../config/db.js";
import { error } from "console";

export const getAuditLogs = async ({ page = 1, limit = 20 }) => {
  const offset = (page - 1) * limit;

  const result = await query(
    "SELECT user_id , org_id , email , role_name , action ,created_at FROM audit_logs ORDER BY created_at DESC LIMIT $1  OFFSET $2 ",
    [limit, offset],
  );
  return result.rows;
};
export const createAuditLogs = async ({
  user_id,
  org_id,
  email,
  role_name,
  action,
}) => {
  const validActions = ["LOGIN", "LOGOUT"];
  if (!validActions.includes(action)) {
    return {
      success: false,
      message: "invalid audit action",
    };
  }
  const insertQuery =
    "INSERT INTO audit_logs(user_id , org_id , email , role_name , action) VALUES ($1, $2, $3, $4, $5 ) RETURNING user_id , org_id , email , role_name , action;";
  const result = await query(insertQuery, [
    user_id,
    org_id,
    email,
    role_name,
    action,
  ]);
  return result.rows;
};
