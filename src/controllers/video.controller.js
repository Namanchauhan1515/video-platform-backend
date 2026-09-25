import { Video } from "../models/video.models.js";
import { apiError } from "../utils/apiError.js";
import { apiResponse } from "../utils/apiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { deleteFromCloudinary } from "../utils/deleteFromCloudinary.js"
import mongoose from "mongoose";

const getAllVideo = asyncHandler(async(req,res)=>{
    const {page=1,limit = 10, query , sortBy ="createdAt" , sortType="desc" , userId} =req.query
    const matchStage =  {
        isPublished:true
    }
    if(query?.trim()){
        matchStage.$or = [
            {
                title:{
                    $regex:query.trim(),
                     $options:"i"
                }
            },
            {
                description:{
                    $regex:query.trim(),
                    $options:"i"
                }
            }
        ]}
        if(userId){
            matchStage.owner = new mongoose.Types.ObjectId(userId)
        }


        const sortStage = {}
        sortStage[sortBy] = sortType === "asc" ? 1 : -1
        const pipline = [
            {
                $match: matchStage
            },
            
            {
                $lookup:{
                    from:"users",
                    localField:"owner",
                    foreignField:"_id",
                    as:"owner"
                }
            },
            {
                $unwind:{
                    path:"$owner",
                    preserveNullAndEmptyArrays:true
                }
            },
            {
            $project:{
                videofield:1,
                thumbnail:1,
                title:1,
                discription:1,
                duration:1,
                views:1,
                isPublished:1,
                createdAt:1,
            
                owner:{
                _id:1,
                username:1,
                fullname:1,
                avatar:1
            }
        }
    },
    {
     $sort : sortStage
    }
   ]
   //peginate
   const options ={
    page:Number(page),
    limit:Number(limit)
    } 

 const video = await Video.aggregatePaginate(Video.aggregate(pipline), options)
if (video.docs.length === 0) {
    throw new apiError(404, "No videos found");
}
    return res.status(200).json(
        new apiResponse(200,
            video,
            "Video fetched successfully"
        )
    )
})
const publishVideo = asyncHandler(async(req,res)=>{
    const {title,discription} = req.query
    if(!title?.trim() || !discription?.trim()){
        throw new apiError(400,"Title and discription is required")
    }
    const videoLocalPath = req.files?.video?.[0]?.path
    const thumbnailLocalpath = req.files?.thumbnail?.[0]?.path
    if(!videoLocalPath || !thumbnailLocalpath){
        throw new apiError(400,"Video and thumbnail is required")
    }
    const videoFile = await uploadOnCloudinary(videoLocalPath)
     if(!videoFile?.secure_url){
        throw new apiError(500,"Video upload failed")
     }
     const thumbnailFile = await uploadOnCloudinary(thumbnailLocalpath)
        if(!thumbnailFile?.secure_url){
            throw new apiError(500,"Thumbnail upload failed")
        }
        const video = await Video.create({
                    title: title.trim(),
                    discription: discription.trim(),
                    videofield: videoFile.secure_url,
                    thumbnail: thumbnailFile.secure_url,
                    duration: req.body.duration,
                    owner: req.user._id
        })
        return res.status(201).json(new apiResponse(201,video,"Video published successfully"))
})
const getVideoById = asyncHandler(async(req,res)=>{
    const {videoId} = req.params
    if (!mongoose.isValidObjectId(videoId)){
        throw new apiError(400,"Invalid videoId")
    }
    const video = await Video.findById(videoId)
    if(!video){
        throw new apiError(404,"Video not found")
    }
    return res.status(200).json(new apiResponse(200,video,"video fetched successfully"))
})

const updateVideo = asyncHandler(async(req,res)=>{
const {videoId} = req.params
if(!mongoose.isValidObjectId(videoId)){
    throw new apiError(400,"Invalid videoId")
}
const video = await Video.findById(videoId)
if(!video){
    throw new apiError(404,"Video not found")
}
const {title,discription} = req.body

if(title?.trim()){
    video.title = title.trim()
}
if(discription?.trim()){
    video.discription = discription.trim()
}

const videoLocalPath = req.files?.video?.[0]?.path
if(videoLocalPath){
    const oldVideo = video.videofield
    
    const videoFile = await uploadOnCloudinary(videoLocalPath)
    if(!videoFile?.secure_url){
        throw new apiError(500,"Video upload failed")
    }
    video.videofield = videoFile.secure_url
    video.duration = videoFile.duration
    if(oldVideo){

        await deleteFromCloudinary(oldVideo)
    }
}
const thumbnailLocalPath = req.files?.thumbnail?.[0]?.path
if(thumbnailLocalPath){
    const oldThumbnail = video.thumbnail
    const thumbnailFile = await uploadOnCloudinary(thumbnailLocalPath)
    if(!thumbnailFile?.secure_url){
        throw new apiError(500,"Thumbnail upload failed")
    }
    video.thumbnail = thumbnailFile.secure_url
    if(oldThumbnail){
        await deleteFromCloudinary(oldThumbnail)
    }
}
await video.save()
return res.status(200)
.json(new apiResponse(200,video,"video updated sucessfully"))
})
const deleteVideo = asyncHandler(async (req,res)=>{
    const {videoId} = req.params
    if(!mongoose.isValidObjectId(videoId)){
        throw new apiError(400,"Invalid videoId")
    }
    const video = await Video.findByIdAndDelete(videoId)
    return res.status(200).json(
        new apiResponse(200,video,"Video deleted successfully")
    )
    
})
const togglePublishStatus = asyncHandler(async(req,res)=>{
    const {videoId} = req.params
    if(!mongoose.isValidObjectId(videoId)){
        throw new apiError(400,"Invalid videoId")
    }
    const video = await Video.findById(videoId)
    if(!video){
        throw new apiError(404,"Video not found")
    }
    video.isPublished = !video.isPublished
     await video.save()
    return res.status(200)
    .json(
        new apiResponse(200,video,"Video publish status toggled successfully"))
    

})
export { getAllVideo ,
    publishVideo,
    getVideoById,
    updateVideo,
    deleteVideo,
    togglePublishStatus}