import { asynchandler } from "../utils/AsyncHandler.js"; 
import { ApiError } from "../utils/ApiError.js";
import { User } from "../models/user.model.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import jwt from "jsonwebtoken"

const options = {
  httpOnly:true,
  secure:true
}

const AccessTokenandRefreshToken = async(userid)=>{
  try {
    const user = await User.findById(userid);
    const AccessToken = user.generateAccessToken();    
    const RefreshToken = user.generateRefreshToken();
      user.refreshToken = RefreshToken;
      await user.save({validateBeforeSave:false})
      return {AccessToken,RefreshToken}

  } catch (error) {
     throw new ApiError(500,error)
  }
}

const registerUser = asynchandler(async(req,res,next)=>{
  //get user details from frontend
  // validation-not empty
  // check if user already exists : username and email 
  // check for images , avatar
  // upload them to cloudinary
  // create user object - entry in db
  // check user created or not
  // remove password and refresh token from response
  // retrun response to frontend

   const {fullname,username,password,email}= req.body;
   console.log(fullname,username,email,password);

   if(
    [fullname,email,username,password].some((field)=>(field?.trim()===""))
   ){
    throw new ApiError(400,"All fields are required");
   }
   const existedUser =  await User.findOne({
      $or: [{ username: username }, { email: email }]
    })
    if(existedUser){
      throw new ApiError(409,"Username or Email already exists");
    }  
    // console.log(req.files);
    

   const avatarLocalPath = req.files?.avatar[0]?.path
   let coverImageLocalPath ;
  if(req.files && Array.isArray(req.files.coverImage)  && req.files.coverImage.length > 0){
    coverImageLocalPath = req.files.coverImage[0].path;
  }
    // console.log(avatarLocalPath);

    if(!avatarLocalPath){
      throw new ApiError(400,"avatar is  required");
    }
   const avatar = await uploadOnCloudinary(avatarLocalPath);
   const coverImage = await uploadOnCloudinary(coverImageLocalPath);
  //  console.log('avatar is',avatar);


   if(!avatar){
    throw new ApiError(400,"avatar is  required");
   }
   
  const user = await User.create({
    fullname,email,password,
    username:username.toLowerCase(),
    avatar:avatar.url,
    coverImage:coverImage?.url || ""
   })

  const CreatedUser = await User.findById(user._id).select(
    "-password -refreshToken"
   )

   if(!CreatedUser){
    throw new ApiError(404,"User not created");
   }
   return res.status(201).json(
     new ApiResponse(201,CreatedUser,"User is successfully registered")
   )
})



const loginUser = asynchandler(async (req,res)=>{
    // req.body-> data
    // username or email (login through)
    // find the user
    // check for password
    // accesstoken and refresh token
    // send cookie




  const {email,password,username} = req.body;

 
    if(!username && !email){
      throw new ApiError(400,"username or email are required");
    }
   const user = await  User.findOne({
      $or:[{username},{email}]
     })

     if(!user){
      throw new ApiError(404,"User not found");
     }

     const isPasswordValid = user.isPasswordCorrect(password);
     

     if(!isPasswordValid){
      throw new ApiError(401,"Invalid password");
     }
      const {AccessToken,RefreshToken} =await AccessTokenandRefreshToken(user._id);

      const LoggedInUser =  await User.findById(user._id).select("-password -refreshToken");
      

    return  res
    .status(201).
    cookie("AccessToken",AccessToken,options)
    .cookie("RefreshToken",RefreshToken,options).json(
      new ApiResponse(200,{
        user:LoggedInUser,
        accesstoken:AccessToken,
        refreshToken:RefreshToken
      },
      "User logged in successfully"
    )
    )

})



const logoutUser = asynchandler(async(req,res) =>{
   const user = await User.findByIdAndUpdate(req.user._id,{
    $set :{
      RefreshToken:undefined
    }
   },{
    new :true // return updated value for true
   })
   const options = {
    httpOnly:true,
    secure:true
   }
   console.log("LOgged out");
   
   return res
   .status(201)
   .clearCookie("AccessToken",options)
   .clearCookie("RefreshToken",options)
   .json(
    new ApiResponse(201,{},"User Logged out Successfully")
   )
})

const RefreshAccessToken = asynchandler(async(req,res)=>{
 
  
  const incomingrefreshToken = req.cookies?.RefreshToken || req.body.RefreshToken;
  if(!incomingrefreshToken){
    throw new ApiError(401,"unauthoirzed request1");
  }
  const decodedToken = jwt.verify(incomingrefreshToken, process.env.REFRESH_TOKEN_SECRET, options);
   if(!decodedToken){
    throw new ApiError(401,"Undefined TOken");
   }
   const user = await User.findById(decodedToken._id);
   if(!user){
    throw new ApiError(401,"Invalid Token");
   }
   if(incomingrefreshToken!==user.refreshToken){
    throw new ApiError(401,"Invalid Token");
   }
   const {AccessToken,RefreshToken} = await AccessTokenandRefreshToken(user._id);

   res.
   status(201).
   cookie("AccessToken",AccessToken,options).
   cookie("RefreshToken",RefreshToken,options).
   json(
    new ApiResponse(201,
      {
        "AccessToken":AccessToken,
        "RefreshToken":RefreshToken
      },
      "Access Token Refreshed Successfully")
   )
})

const changeCurrentPassword = asynchandler(async(req,res)=>{
  const {oldPassword,newPassword,confirmPassword} = req.body;
  if(!oldPassword || !newPassword){
    throw new ApiError(400,"oldPassword and newPassword are required");
  }
  const user = await User.findById(req.user._id);
 const isPasswordCorrect =  await user.isPasswordCorrect(oldPassword);
  if(!isPasswordCorrect){
    throw new ApiError(400,"Invalid Password");
  }
  user.password = newPassword;

  if(newPassword!==confirmPassword){
    throw new ApiError(400,"Password and Confirm Password should be same")
  }
  await user.save({validateBeforeSave:false});

  return res.statue(201).
  json(new ApiResponse(201,{},"Password changed successfully"));
})

const updateAccountDetails = asynchandler(async(req,res)=>{
  const {fullname,email,phone} = req.body;
  
  if(!fullname || !email || !phone){
    throw new ApiError(400,"fullname,email,phone are required");
  }
  const user = await User.findByIdAndUpdate(req.user._id, {
   $set :{    fullname,
              phone,
              email
            }
  }, {new:true}).select("-password -refreshToken");
   
    return res.status(201).json(new ApiResponse(201,user,"User details updated successfully")); 

});

const updateProfileImage = asynchandler(async(req,res)=>{
  const avatarLocalPath = req.file?.path;
  if(!avatarLocalPath){
    throw new ApiError(400,"avatar is required");
  }

  const avatar = await uploadOnCloudinary(avatarLocalPath);
  if(!avatar){
    throw new ApiError(400,"error while uploading in cloudinary");
  }
  const user = await User.findByIdAndUpdate(req.user._id,{
    $set : {avatar:avatar.url}
  },{new:true}).select("-password -refreshToken");

  return res.status(201).json(new ApiResponse(201,user,"Profile Image updated successfully"));
  });

const updateCoverImage = asynchandler(async(req,res)=>{ 
  const coverLocalPath = req.file?.path;
  if(!coverLocalPath){
    throw new ApiError(400,"cover is required");
  }
  const cover = await uploadOnCloudinary(coverLocalPath);
  if(!cover){
    throw new ApiError(400,"error while uploading in cloudinary");
  }
  const user = await User.findByIdAndUpdate(req.user._id,{
    $set : {coverImage:cover.url}
  },{new:true}).select("-password -refreshToken");
  return res.status(201).json(new ApiResponse(201,user,"Cover Image updated successfully"));
  });

  const getUserProfile = asynchandler(async(req,res)=>{
    const user = await User.findById(req.params.id).select("-password -refreshToken");

    if(!user){
      throw new ApiError(404,"User not found");
    }
    const channel = await User.aggregate([
      {
        $match:{_id:user._id}
      },
      {
        $lookup:{
          from:"subscriptions", // model name always in lowercase and plural
          localField:"_id",
          foreignField:"subscriber",
          as:"subscribedTo"
        }
      },
      {
        $lookup:{
          from:"subscriptions", // model name always in lowercase and plural
          localField:"_id",
          foreignField:"channel",
          as:"subscribers"
        }  
      },
      {
        $addFields:{
          totalSubscribers:{$size:"$subscribers"},
          totalSubscribedTo:{$size:"$subscribedTo"}
        }
      },
      {
        $project:{
          username:1,
          fullname:1,
          email:1,
          coverImage:1,
          avatar:1,
          totalSubscribers:1,
          totalSubscribedTo:1
          }
      }
    ])
  })
export {
  registerUser,
  loginUser,
  logoutUser,
  RefreshAccessToken,
  changeCurrentPassword,
  updateAccountDetails,
  updateProfileImage,
  updateCoverImage,
  getUserProfile
}
