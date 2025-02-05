import dotenv from "dotenv"; // To load the environment variables to the index
import connectDB from "./db/index.js";
import { app } from "./app.js";

dotenv.config({
    path: "./env"
    });

connectDB()
.then(()=>{
    app.listen(process.env.PORT || 8000,()=>{
        console.log(`server is running on port ${process.env.PORT}`);  
    })
})
.catch((eror)=>{
    console.log("connection failed !!",eror);
})

