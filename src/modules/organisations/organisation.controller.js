import validator from 'validator';
import {
  createOrgService,verifyOrgService
}from './organisation.service.js';
export const createOrg = async (req , res ) => {

  try{
    const {name , email , domain  } = req.body;
    if(!name || !email ){
      return res.status(400).json({
        error : "organisation name and email are required. "

      });
    }
    if(!validator.isEmail(email)){
      return  res.status (400).json({
        error : "invalid organiation emailId"
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