import mongoose from "mongoose";
import { DB_NAME } from "../constants.js";

const connectDB = async()=>{
    try {
      const connnectionInstance =   await mongoose.connect(`${process.env.MONGODB_URI}/${DB_NAME}}`)
      console.log(`MOngo is connected successfully db host is: ${connnectionInstance.connection.host}`);
      
    } catch (error) {
        console.log("connnection failed bro",error);
      process.exit(1);  
    }
}

export default connectDB