import { apiError } from "../utils/apiError.js";
import { User } from "../models/users.models.js";
import { apiResponse } from "../utils/apiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { generateAccessAndRefreshToken } from "../utils/generateAccessAndRefreshToken.js";
import jwt from "jsonwebtoken"
const registerUser = asyncHandler(async(req,res)=>{
    const {fullname,email,username,password} = req.body ;
    // console.log("email",email);
    if(!fullname ||!email||!username||!password){
        throw new apiError(400,"All field are required")
    }
    const existedUser  = await User.findOne({
        $or:[{email},{username}]
    })
    if(existedUser){
        throw new apiError(409,"User will already exist with this email or username")
    }

    const avatarLocalPath = req.files?.avatar?.[0]?.path;
    
    const coverImageLocalPath = req.files?.coverImage?.[0]?.path;
    console.log("AVatar loaclPath",avatarLocalPath);
    if(!avatarLocalPath){
           throw new apiError(400,"Avatar file is required")
    }
    const avatarUploadOnCloudinary = await uploadOnCloudinary(avatarLocalPath);
    const coverImageUploadOnCloudinary = coverImageLocalPath ? await uploadOnCloudinary(coverImageLocalPath):null;
    if(!avatarUploadOnCloudinary){
        throw new apiError(400,"Avatar  file is required")
    }
    const  user =  await User.create({
        fullname,
        avatar:avatarUploadOnCloudinary.url,
        coverImage:coverImageUploadOnCloudinary?.url ||"",
        email,
        password,
        username:username.toLowerCase()
    })
    const createUser = await User.findById(user._id).select(
        "-password -refreshToken"
    )
    if(!createUser){
        throw new apiError(500,"something went wrong while registering the user")
    }
    return res.status(201).json(
        new apiResponse(200,createUser,"User registered Successfully")
    )
})
const loginUser = asyncHandler(async(req,res)=>{
 const {username,email,password}=req.body;
 if(!(username || email)){
    throw new apiError(400,"username or email is required")
 }
const user  =await User.findOne({
    $or:[{username}, {email}]
})
if(!user){
    throw new apiError(404,"User not found")
}
const isPasswordValid = await user.isPasswordCorrect(password)
if(!isPasswordValid){
    throw new apiError(401,"Invalid user cradentials")
}
const {accessToken,refreshToken} = await generateAccessAndRefreshToken(user._id)
const loggedInUser = await User.findById(user._id).select("-password -refreshToken")
const options={
    httpOnly:true,
    secure:true
}
return res.status(200)
.cookie("accessToken",accessToken,options)
.cookie("refreshToken",refreshToken,options)
.json(
    new apiResponse(200,{
        user:loggedInUser,accessToken,
        refreshToken
},
"user logged In successfully"
)
)
})
const logoutUser = asyncHandler(async(req,res)=>{
    await User.findByIdAndUpdate(req.user._id,{
        $unset:{
            refreshToken:1 // this remove the field from document it use unset
        }
      }
    ,{
        new:true
    })
    const options={
    httpOnly:true,
    secure:true
}
return res.status(200).clearCookie("accessToken",options)
.clearCookie("refreshToken",options).json(
    new apiResponse(200,{},"User logged Out")
)
})
const refreshAccessToken = asyncHandler(async(req,res)=>{
   const incomingRefreshToken =  req.cookies?.refreshToken ||req.body?.refreshToken
   if(!incomingRefreshToken){
    throw new apiError(401,"unauthorized request")
   }
  try {
     const decodedToken = jwt.verify(
      incomingRefreshToken,process.env.REFRESH_TOKEN_SECRET
     )
     const user = await User.findById(decodedToken?._id)
  
     if(!user){
      throw new apiError(401,"Invalid refresh token")
     }
  if(incomingRefreshToken !==user?.refreshToken){
      throw new apiError(401,"Refresh token is expired or used")
  }
  const options={
      httpOnly:true,
      secure:true
  }
  const {accessToken,refreshToken} = await generateAccessAndRefreshToken(user._id)
  return res.
  status(200)
  .cookie("accessToken",accessToken,options)
  .cookie("refreshToken",refreshToken,options)
  .json(
      new apiResponse(200,
          {accessToken,refreshToken},
          "Access token refresh"
      )
  
  )
  } catch (error) {
    throw new apiError(401,error?.message||"Invalid refresh token")
  }

})

const changeCurrentPassword = asyncHandler(async(req,res)=>{
    const {oldPassword ,newPassWord,conformPassword}=req.body
      if(newPassWord !== conformPassword){
        throw new apiError(400,"newpassword and conformpassword is not match")
    }
     
    const user = await User.findById(req.user?._id)
    const isPasswordCorrect = await user.isPasswordCorrect(oldPassword)
   

    if(!isPasswordCorrect){
        throw new apiError(400,"oldpassword is incorrect")
    }
    
    user.password = newPassWord
    await user.save({validateBeforeSave:false})
    return res
    .status(200)
    .json(new apiResponse(200,{},"Password change successfully"))

})
const getCurrentUser = asyncHandler(async (req,res)=>{
 return res.status(200).json(
    new apiResponse(200,req.user,"current user fatch successfully")
 )
})

const updateAccountDetails = asyncHandler(async(req,res)=>{
    const{fullname,email} = req.body
    if(!(fullname || email)){
        throw new apiError(400,"fullname or email update is required")
    }
    const user = await User.findByIdAndUpdate(req.user?._id
        ,{
            $set:{
                fullname:fullname,
                email:email
            }
        },{new:true}
    ).select("-password")

    return res.status(200)
    .json(new apiResponse(200,user,"Account detail successfully"))
})
const updateUserAvatar = asyncHandler(async(req,res)=>{
 const avatarLocalPath = req.file?.path
 if(!avatarLocalPath){
    throw new apiError(400,"Avatar file is missing")
 }
 const user = await User.findById(req.user?._id);


 if(!user){
      throw new apiError(404, "User not found");
 }
 const oldAvatar = user.avatar;

 const newAvatar = await uploadOnCloudinary(avatarLocalPath)
 if(!newAvatar?.url){
    throw new apiError(400,"Error while uplaoding on avatar")
 }
 const updateUser = await User.findByIdAndUpdate(req.user?._id,
    {
        $set:{
            avatar:newAvatar.url
        }
    },
    {new:true}
 ).select("-password")

 // Delete old avatar from Cloudinary
    if (oldAvatar) {
        await deleteFromCloudinary(oldAvatar);
    }
 res.status(200).json(
    new apiResponse(200,{updateUser},"avatar update successfully")
)

})
const updateUserCoverImage = asyncHandler(async(req,res)=>{
   const coverImageLoacalPath =  req.file?.path
   if(!coverImageLoacalPath){
    throw new apiError(400,"coverImage was missing")

   }
   const coverImage = await uploadOnCloudinary(coverImageLoacalPath)
   if(!coverImage.url){
    throw new apiError(400,"Error while uploading coverImage ")
   }
   const user  =await User.findByIdAndUpdate(req.user._id,
    {
        $set:{
            coverImage :coverImage.url
        }
    },
    {
        new:true
    }
).select("-password")

res.status(200).json(
    new apiResponse(200,{user},"cover Iamge update successfully")
)

})

const getUserChannelProfile = asyncHandler(async (req, res) => {

    const { username } = req.params;

    // Check username
    if (!username?.trim()) {
        throw new apiError(400, "Username is missing");
    }

    const channel = await User.aggregate([

        // 1. Find user/channel
        {
            $match: {
                username: username.toLowerCase()
            }
        },

        // 2. Find people who subscribed to this channel
        {
            $lookup: {
                from: "subscriptions",
                localField: "_id",
                foreignField: "channel",
                as: "subscribers"
            }
        },

        // 3. Find channels this user subscribed to
        {
            $lookup: {
                from: "subscriptions",
                localField: "_id",
                foreignField: "subscriber",
                as: "subscriberTo"
            }
        },

        // 4. Calculate counts and subscription status
        {
            $addFields: {

                // How many subscribers does this channel have?
                subscribersCount: {
                    $size: "$subscribers"
                },

                // How many channels has this user subscribed to?
                channelsSubscribedToCount: {
                    $size: "$subscriberTo"
                },

                // Is current logged-in user subscribed?
                isSubscribed: {
                    $in: [
                        req.user?._id,
                        "$subscribers.subscriber"
                    ]
                }
            }
        },

        // 5. Return only required fields
        {
            $project: {
                fullname: 1,
                username: 1,
                subscribersCount: 1,
                channelsSubscribedToCount: 1,
                isSubscribed: 1,
                avatar: 1,
                coverImage: 1,
                email: 1
            }
        }
    ]);

    // 6. Check channel exists
    if (!channel?.length) {
        throw new apiError(404, "Channel does not exist");
    }

    console.log("channelValue:", channel);

    // 7. Send response
    return res.status(200).json(
        new apiResponse(
            200,
            channel[0],
            "User channel fetched successfully"
        )
    );
}); 
const getWatchHistory = asyncHandler(async(req,res)=>{
    const user = await User.aggregate([
        {
            $match:{
                _id: new mongoose.Types.ObjectId(req.user._id)
            }
        },
        {
            $lookup :{
                from: "videos",
                localField:"watchHistory",
                foreignField:"_id",
                as:"watchHistory",
                pipeline:[
                    {
                        $lookup:{
                            from:"users",
                            localField:"owner",
                            foreignField:"_id",
                            as:"owner",
                            pipeline:[
                                {
                                    $project:{
                                        fullName:1,
                                        username:1,
                                        avatar:1,

                                    }
                                }
                            ]
                        }
                    },
                    {
                        $addFields:{
                            owner:{
                                $first:"$owner"
                            }
                        }
                    }
                ]
            }
        }
    ])

    return res.status(200).json(
        new apiResponse(200,user[0].watchHistory,
            "watch History fetched successfully"
        )
    )
})

export {registerUser,
    loginUser,
    logoutUser,
    refreshAccessToken,
    changeCurrentPassword,
    getCurrentUser,
    updateAccountDetails,
    updateUserAvatar,
    updateUserCoverImage,
    getUserChannelProfile,
    getWatchHistory
}