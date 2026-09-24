import { Video } from "../models/video.models.js";
import { apiError } from "../utils/apiError.js";
import { apiResponse } from "../utils/apiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const getAllVideo = asyncHandler(async(req,res)=>{
    const {page=1,limit = 10, query , sortBy , sortType , userId} =req.query
    const video = await Video.aggregate([
        {
            $match:{
                isPublished:true
            }
        }
    ])
if (video.length === 0) {
    throw new apiError(404, "No videos found");
}
    return res.status(200).json(
        new apiResponse(200,
            video,
            "Video fetched successfully"
        )
    )
})

export { getAllVideo }