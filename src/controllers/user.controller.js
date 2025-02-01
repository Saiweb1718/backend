import { asynchandler } from "../utils/AsyncHandler.js"; 
import { ApiError } from "../utils/ApiError.js";
import { User } from "../models/user.model.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { ApiResponse } from "../utils/ApiResponse.js";


const AccessTokenandRefreshToken = async(userid)=>{
  try {
    const user = await User.findById(userid);
     const AccesToken = user.generateAccessToken();
     const RefreshToken = user.generateRefreshToken();
      user.refreshToken = RefreshToken;
      await user.save({validateBeforeSave:false})
      return {AccesToken,RefreshToken}

  } catch (error) {
     throw new ApiError(500,"Error while generating the Accesstoken and refreshToken")
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

    if(!username || !email){
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
      const {AccesToken,RefreshToken} =await AccessTokenandRefreshToken(user._id);

      const LoggedInUser =  user.select("-password -refreshToken")
      
      const options = {
        httpOnly:true,
        secure:true
      }

    return  res
    .status(201).
    cookie("AccessToken",AccesToken,options)
    .cookie("RefreshToken",RefreshToken,options).json(
      new ApiResponse(200,{
        user:LoggedInUser,
        accesstoken:AccesToken,
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
   return res
   .status(201)
   .clearCookie("AccesToken",options)
   .clearCookie("RefreshToken",options)
   .json(
    new ApiResponse(201,{},"User Logged out Successfully")
   )
})

export {registerUser,loginUser,logoutUser}