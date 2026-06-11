import crypto from 'crypto';
import { query } from '../../config/db.js';

const generateInviteToken = () => {
  return crypto.randomBytes(32).toString('hex');
};

export const createUserAuthority = async ({ user_id, org_id, role_id }) => {

  // check if user already in this org — correct table
  const existingCheck = await query(
    'SELECT user_id FROM user_authority WHERE user_id = $1 AND org_id = $2',
    [user_id, org_id]
  );
  if (existingCheck.rows.length > 0) {
    throw new Error('User is already part of this organisation.');
  }

  // check if user exists — query USERS table
  const userCheck = await query(
    'SELECT user_id FROM users WHERE user_id = $1',
    [user_id]
  );
  if (userCheck.rows.length === 0) {
    throw new Error('User not found.');
  }

  // check if org exists — query ORGANIZATIONS table
  const orgCheck = await query(
    'SELECT org_id FROM organizations WHERE org_id = $1 AND status = $2',
    [org_id, 'ACTIVE']
  );
  if (orgCheck.rows.length === 0) {
    throw new Error('Organisation not found or not active.');
  }

  // check if role exists — query ROLES table
  const roleCheck = await query(
    'SELECT role_id FROM roles WHERE role_id = $1',
    [role_id]
  );
  if (roleCheck.rows.length === 0) {
    throw new Error('Role not found.');
  }

  // generate token and insert
  const inviteToken = generateInviteToken();

  const insertQuery = `
    INSERT INTO user_authority (user_id, org_id, role_id, status, invite_token)
    VALUES ($1, $2, $3, 'PENDING', $4)
    RETURNING user_id, org_id, role_id, status;
  `;

  const result = await query(insertQuery, [user_id, org_id, role_id, inviteToken]);

  return {
    userAuthority: result.rows[0],
    inviteToken
  };
};
export const verifyUserAuthority = async ({userToken}) => {
    const tokenCheck = await query(
        'SELECT * FROM user_authority WHERE invite_token =$1',[userToken]
    );
    if(tokenCheck.rows.length === 0){
        throw new Error ('invite token invalid or expired');
    }
    const record = tokenCheck.rows[0];
    if(record.status === 'ACTIVE'){
        throw new Error ('user is already active in the organisation ');
    }

    const updateQuery =
        `
    UPDATE user_authority
    SET status = 'ACTIVE',
        invite_token = NULL
    WHERE invite_token = $1
    RETURNING user_id, org_id, role_id, status;
  `;
    
  const result = await query(updateQuery,[userToken]);
  return {
    userAuthority : result.rows[0]
  };


};