import mongoose from "mongoose";
import { asyncHandler } from "../utils/asyncHandler.js";
import { apiError } from "../utils/apiError.js";
import { apiResponse } from "../utils/apiResponse.js";
import { Video } from "../models/video.models.js";
import { Comment } from "../models/comment.model.js";
const getVideoComment = asyncHandler(async(req,res)=>{
    const {videoId} = req.params
    const {page = 1, limit = 10} = req.query
    if(!mongoose.isValidObjectId(videoId)){
        throw new apiError(400," Invalid videoId ")
    } 

    const video = await Video.findById(videoId)
    if(!video){
        throw new apiError(404,"video is not found")
    }
   const pipeline =[
    {
        $match:{
            video : new mongoose.Types.ObjectId(videoId)
        }
    },{
        $sort:{
            createdAt:-1
        }
    },{
         $lookup:{
         from:"users",
         localField:"owner",
         foreignField:"_id",
         as:"owner"
    }
    },
    {$unwind:"$owner"},
    {
        $project:{
              _id: 1,
                content: 1,
                createdAt: 1,

                owner: {
                    _id: "$owner._id",
                    username: "$owner.username",
                    avatar: "$owner.avatar"
                }

        }
    }
   
   ]
       
    const comment = await Comment.aggregatespaginate(
        Comment.aggregate(pipeline),
        {
            page:Number(page),
            limit:Number(limit)
        }
    )
    return res.status(200).json(
        new apiResponse(
            200,
            comment,
            "Comments fetched successfully"
        )
    )

})
const addComment = asyncHandler(async(req,res)=>{
     const {content} = req.body
     const {videoId} = req.params
     if(!mongoose.isValidObjectId(videoId)){
        throw new apiError(400,"Invalid videoId")
     }
     if(!content?.trim()){
        throw new apiError(400,"comment content is required")
     }
     const video = await Video.findById(videoId)
         if (!video) {
        throw new apiError(404, "Video not found");
    }
    const comment = await Comment.create({
        content:content.trim(),
        video:videoId,
        owner:req.user._id
    })
        return res.status(201).json(
        new apiResponse(
            201,
            comment,
            "Comment added successfully"
        )
    )
})
const updateComment = asyncHandler(async(req,res)=>{
    const {videoId,commentId} = req.params
    const {content} = req.body
    if(!videoId || !commentId){
        throw new apiError(400,"videoId and CommentId is Invalid")
    }
    if(!content.trim()){
        throw new apiError(400,"Content is required")
    }
    const video = await Video.findById(videoId)
        if (!video) {
        throw new apiError(404, "Video not found");
    }
    const commentUpdate = await Comment.findOneAndUpdate({
        _id:commentId,
        video:videoId,
        owner:req.user._id
    },
{
    $set:{
        content:content.trim()
    }
},
{
        new:true
    }
)
    if (!commentUpdate) {
        throw new apiError(
            404,
            "Comment not found or you are not the owner"
        );
    }

return res.status(200).json(new
    apiResponse(200,commentUpdate,"comment update successfully")
)
})
const deleteComment = asyncHandler(async(req,res)=>{
    const {commentId} = req.params
     if (!mongoose.isValidObjectId(commentId)) {
        throw new apiError(400, "Invalid comment ID");
    }
       const comment = await Comment.findOneAndDelete({
        _id: commentId,
        owner: req.user._id
    })
        if (!comment) {
        throw new apiError(
            404,
            "Comment not found or you are not the owner"
        );
    }
return res.status(200).json(
        new apiResponse(
            200,
            {},
            "Comment deleted successfully"
        )
    )
})


export {getVideoComment,addComment,updateComment,deleteComment}