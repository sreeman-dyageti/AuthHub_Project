import jwt from "jsonwebtoken";

export const authentication = async (req, res, next)=>{
    const authHeader = req.headers.authorization;

    if (!authHeader){
        return res.status(401).json({
            error:"Access Token Required"
        });
    }

const [scheme, token] = authHeader.split(' ');

if (scheme !== 'Bearer' || !token) {
    return res.status(401).json({
      error: 'Authorization header must be: Bearer <accessToken>'
    });
}

try {
  
    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET
    );

    req.user = decoded;

    next();

  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        error: 'Access token expired'
      });
    }

    return res.status(401).json({
      error: 'Invalid access token'
    });

  }

}