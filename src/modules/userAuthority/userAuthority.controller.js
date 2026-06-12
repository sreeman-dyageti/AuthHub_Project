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
        if(!result.success){
            return res.status(400).json({
                success: false,
                message:result.message
            });
        }
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

        const{ userToken  } = req.params;
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
        return res.status(400).json({
            message: error.message
        });
    }
};
export const updateUser = async (req, res) => {
  try {

   
    const { user_id, org_id, role_id, status } = req.body;

   
    if (!user_id || !org_id) {
      return res.status(400).json({
        message: 'user_id and org_id are required.'
      });
    }


    if (!role_id && !status) {
      return res.status(400).json({
        message: 'Provide at least role_id or status to update.'
      });
    }

    
    const result = await updateUserAuthority({ user_id, org_id, role_id, status });

   if(!result.success){
    return res.status(400).json({
        success : false ,
        message: result.message
    });

   }
   return res.status(200).json({
    success : true,
    message : 'user authority has been updated successfully ',
    data : result
   })

  } catch (error) {
    return res.status(400).json({
      message: error.message
    });
  }
};