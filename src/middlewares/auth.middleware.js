import { User } from "../models/user.model.js";
import { ApiError } from "../utils/ApiError.js";
import { asynchandler } from "../utils/AsyncHandler.js";
import jwt from "jsonwebtoken"

export const verifyJwt = asynchandler(async(req,_,next)=>{
   try {
    
     const token = req.cookies?.AccessToken || req.header("Authorization")?.replace("Bearer ","")
 
     if(!token){
        throw new ApiError(401,"Unauthorized request")
     }
     const decodedToken = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET)
     const user = await User.findById(decodedToken?._id).select("-password -refreshToken")
     if(!user){
         throw new ApiError(401,"Invalid accesToken");
     }
     req.user = user
     next()
   } catch (error) {
     throw new ApiError(401,error?.message || "Invalid user")
   }
})