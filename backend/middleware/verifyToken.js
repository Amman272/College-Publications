import jwt from "jsonwebtoken"

export function verifyToken(req , res,next){
    const token =req.headers.authorization?.split(" ")[1];
    if(!token){
        return res.status(401).json({message:"no token"});

    }

    try{
        const decoded=jwt.verify(token,process.env.JWT_SECRET);
        req.user=decoded;
        next();
    }
    catch(e){
        return res.status(401).json({message:"error in decoding"});
    }
}