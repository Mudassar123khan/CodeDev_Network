const adminOnly  = (req,res,next)=>{
    try{
        const role = req.user.role;

        if(role !== "admin"){
            return res.status(403).json({
            success:false,
            message:"Access denied, Admins only"
        });  
        }

        next();
    }catch(err){
        console.log(`An error occured ${err.message}`);
        res.status(500).json({
            success:false,
            message:"Internal server error",
        });
    }
}

export default adminOnly;