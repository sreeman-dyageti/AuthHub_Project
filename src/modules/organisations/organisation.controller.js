import validator from 'validator';
import {
  createOrgService,verifyOrgService
}from './organisation.service.js';
import isEmail from 'validator/lib/isEmail.js';
export const createOrg = async (req , res ) => {

  try{
    const {name , email , domain  } = req.body;
    
    const errors = [];
    if(!name || name.trim() === ''){
      errors.push('organisation name is required');
    } 
    if(!email || email.trim() === ''){
      errors.push('organisation email are required');
    }
    if(!domain || domain.trim() === ''){
      errors.push('organisation domain are required');
    }
    if(email && !validator.isEmail(email)){
      errors.push('Invalid email format ');
    }
    if(errors.length > 0){
      return res.status(400).json({
        success : false,
        errors
      });
    }

    const result = await createOrgService ({name , email , domain});
    res.status(201).json({
      message : 'organisation created successfully. please verify organisation. ',
      data : result 
    });

  }
  catch (error) {

    
  console.error("CREATE ORG ERROR:", error);

  res.status(400).json({
    error: error.message
  });
}




};
export const verifyOrg = async (req , res) => {
  try {
    const {token } = req.params;
   const result = await verifyOrgService(token);
   res.status(200).json(result );  
  }
  catch (error) {

  console.error("VERIFY ORG ERROR:", error);

  res.status(400).json({
    error: error.message
  });
}
  

};