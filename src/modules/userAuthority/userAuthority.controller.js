import {createUserAuthority, verifyUserAuthority,updateUserAuthority } from './userAuthority.service.js';
export const inviteUser = async(req , res ) => {
    try{

        const { user_id , org_id , role_id } = req.body;

        if(!user_id || !org_id || !role_id){
            return res.status(400).json({
                message : ' user id , org id and role id are required '
            });

        }
        const result = await createUserAuthority({user_id , org_id , role_id });
        return res.status(201).json({
            message : 'user invited successfully .Awaiting for the verification',
            data : result 
        });

    }
    catch(error) {
        return res.status(400).json({
            message:error.message
        });
    }

};
export const verifyUser = async(req, res) => {
    try{

        const{ userToken  } = req.body;
        if(!userToken) {
            return res.status(400).json({
                message : 'Invite token is required '
            });
        }
        const result = await verifyUserAuthority({userToken});
        return res.status(200).json({
            message : 'user verified successfully and added to organisation ',
            data : result 
        });

    }
    catch(error){
        return res.message(400).json({
            message: error.message
        });
    }
};
export const updateUser = async (req, res) => {
  try {

    // Step 1 — read from body
    const { user_id, org_id, role_id, status } = req.body;

    // Step 2 — validate required fields
    if (!user_id || !org_id) {
      return res.status(400).json({
        message: 'user_id and org_id are required.'
      });
    }

    // Step 3 — must send at least one field to update
    if (!role_id && !status) {
      return res.status(400).json({
        message: 'Provide at least role_id or status to update.'
      });
    }

    // Step 4 — call service
    const result = await updateUserAuthority({ user_id, org_id, role_id, status });

    // Step 5 — send response
    return res.status(200).json({
      message: 'User authority updated successfully.',
      data: result
    });

  } catch (error) {
    return res.status(400).json({
      message: error.message
    });
  }
};