import { apiError } from "../utils/apiError.js"
import { apiResponse } from "../utils/apiResponse.js"
import { asyncHandler } from "../utils/asyncHandler.js"
import mongoose , {isValidObjectId} from "mongoose"
import { Video } from "../models/video.model.js"
import { Like } from "../models/like.model.js"
import {Tweet}  from "../models/tweet.model.js"

const toggleVideoLike = asyncHandler(async(req,res)=>{
const {videoId} = req.params
if(!mongoose.isValidObjectId(videoId)){
    throw new apiError(400,"Invalid videoId")
}
const video = await Video.findById(videoId)
if(!video){
    throw new apiError(404,"video not found")
}
const existingLike = await Like.findOne({
    video:videoId,
    likeBy:req.user._id
}) 
if(existingLike){
    await Like.findByIdAndDelete(existingLike._id)
    return res.status(200)
.json(new apiResponse(200,{},"Like toggled successfully"))
}

const likeVideo = await Like.create({
    video:videoId,
    likeBy:req.user._id
})
return res.status(200)
.json(new apiResponse(200,likeVideo,"Like toggled successfully"))
})
const toggleCommentLike = asyncHandler(async(req,res)=>{
  const {commentId} = req.params
  if(!mongoose.isValidObjectId(commentId)){
    throw new apiError(400,"Invalid commentId")
  }
const comment = await Comment.findById(commentId)
if(!comment){
    throw new apiError(404,"Comment not found")
}
const existingCommentLike = await Like.findOne({
    comment:commentId,
    likeBy:req.user._id
})
if(existingCommentLike){
    await Like.findByIdAndDelete(existingCommentLike._id)
    return res.status(200).json(new apiResponse(200,{},"Like toggled successfully"))
}
const likeComment = await Like.create({
    comment:commentId,
    likeBy:req.user._id
})
return res.status(200).json(
    new apiResponse(200,likeComment,"Like toggled successfully")
)
})
const toggleTweetLike = asyncHandler(async(req,res)=>{
    const {tweetId} = req.params
    if(!mongoose.isValidObjectId(tweetId)){
        throw new apiError(400,"Invalid tweetId")
    }
    const tweet = await Tweet.findById(tweetId)
    const existingTweetLike = await Like.findOne({
        tweet:tweetId,
        likeBy:req.user._id
})
if(existingTweetLike){
    await Like.findByIdAndDelete(existingTweetLike._id)
    return res.status(200).json(new apiResponse(200,{},"Like toggled successfully"))
}
const liketweet = await Like.create({
    tweet:tweetId,
    likeBy:req.user._id
  } )
return res.status(200).json(new apiResponse(200,liketweet,"Like toggled successfully"))
})
const getLikedVideos = asyncHandler(async(req,res)=>{
      const { page = 1, limit = 10 } = req.query
    const userId = req.user._id
    const pipeline  = [
        {
            $match:{
                likeBy:new mongoose.Types.ObjectId(userId),
                video:{$ne:null}
            }
        },
        {
            $lookup:{
            from:"videos",
            localField:"video",
            foreignField:"_id",
            as:"video"
        }
    },
    {
        $unwind:"$video"
    },
    {
            $lookup:{
                from:"users",
                localField:"video.owner",
                foreignField:"_id",
                as:"owner"
    }
    },
    { $unwind:"$owner"},
{
            $project: {
                _id: "$video._id",
                videoField: "$video.videoField",
                thumbnail: "$video.thumbnail",
                title: "$video.title",
                discription: "$video.discription",
                duration: "$video.duration",
                views: "$video.views",
                isPublished: "$video.isPublished",
                createdAt: "$video.createdAt",

                owner: {
                    _id: "$owner._id",
                    username: "$owner.username",
                    avatar: "$owner.avatar"
                }
            }
        },
         {
            $sort: {
                createdAt: -1
            }
        }
    ]
  
        const likedVideos = await Like.aggregatePaginate(
        Like.aggregate(pipeline),  {
            page: Number(page),
            limit: Number(limit)
        }
        
    )

    return res.json(200).json(
        new apiResponse(
            200,
            likedVideos,
            "Liked videos fetched successfully"
        )
    )

})

export {toggleVideoLike,toggleCommentLike,toggleTweetLike,getLikedVideos}