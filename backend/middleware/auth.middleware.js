import jwt from 'jsonwebtoken';


const authMiddleware = (req,res,next)=>{
    try{

        //getting authorization header
        const authHeader = req.headers.authorization;
        if(!authHeader || !authHeader.startsWith("Bearer ")){
            return res.status(401).json({
                success:false,
                message:"Unauthorized, no token received"
            });
        }

        //extracting token from authorization header
        const token = authHeader.split(" ")[1];
        
        //verifying the token, if it is correct or not and is not expired
        const decoded=jwt.verify(token,process.env.JWT_SECRET);

        //attaching user to req
        req.user={
            id:decoded.id,
            role:decoded.role,
        }


        next();

    }catch(err){
        return res.status(401).json({
            success:false,
            message:"Unauthorized: Invalid or expired token"
        });
    }
}

export default authMiddleware;