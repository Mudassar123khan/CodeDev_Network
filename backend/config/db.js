import mongoose from "mongoose";

const connectDB = async ()=>{
    try{
        await mongoose.connect(process.env.MONGO_URL);
        console.log("DB connected");
    }catch(error){
        console.log(`An error occured: ${error}`);
    }
}

export default connectDB;