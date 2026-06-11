import crypto from 'crypto';
import { query  } from '../../config/db.js';
import { error } from 'console';

const generateInviteToken = () =>{
    return crypto.randomBytes(32).toString('hex');

};

export const createUserAuthority = async({user_id , org_id, role_id}) => {

    const existingCheck = await query(
        'SELECT user_id FROM user_Authority WHERE user_id = $1 AND org_id = $2',[user_id , org_id ]
    );
    if(existingCheck.rows.length() > 0 ){
        throw new Error('user is already a part of the organisation ');
    }
    const userCheck = await query (
        'select user_id FROM user_Authority WHERE user_id = $1' , [user_id]
    );
    if(userCheck.rows.length === 0){
        throw new Error ('user not found ');
    }
    const orgCheck = await query(
        'select org_id FROM user_Authority WHERE org_id = $1 AND status = $2 ' ,[org_id , 'VERIFIED']
    );
    if(orgCheck.rows.length===0){
        throw new Error('organisation not found ');
    }
    const roleCheck = await query(
        'select role_id FROM user_Authority WHERE role_id = $1',[role_id]
    )
    if(roleCheck.rows.length===0){
        throw new Error('role is not assigned ');
    }
    const inviteToken = generateInviteToken();
    const insertQuery = `
  INSERT INTO user_authority (user_id, org_id, role_id, status, invite_token)
  VALUES ($1, $2, $3, 'PENDING', $4)
  RETURNING user_id, org_id, role_id, status;
`;
const result = await query(insertQuery ,[user_id , org_id , role_id ,inviteToken]);
return {
    userAuthority : result.rows[0],
    inviteToken
};

};