import { apiResponse } from "../utils/apiResponse";
import { asyncHandler } from "../utils/asyncHandler";

 const getChannelStats = asyncHandler(async(req,res)=>{
    const userId = new mongoose.Types.ObjectId(req.user._id);
    const stats = await User.aggregate([
        {
            $match:{
                _id:userId
            }
        },
        {
            $lookup:{
                from:"videos",
                localField:"_id",
                foreginField:"owner",
                as:"videos"
            }
        },
        {
            $lookup:{
                from:"subscription",
                localField:"_id",
                foreginField:"channel",
                as:"subscribers"
            }
        },
        {
            $lookup:{
                from:"likes",
                localField:"videos._id",
                foreginField:"video",
                as:"likes"
            }
        },
        {
            $project:{
                _id :0,
                totalVideos:{
                    $size:"$videos"
                },
                totalView:{
                    $sum:"$videos.views"
                },
                totalSubscribers:{
                    $size:"$subscribers"
                },
                totalLike:{
                    $size:"$likes"
                }

            }
        }
    ])
      return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                stats[0] || {
                    totalVideos: 0,
                    totalViews: 0,
                    totalSubscribers: 0,
                    totalLikes: 0
                },
                "Channel stats fetched successfully"
            )
        )
 })
 const getChannelVideos = asyncHandler(async(req,res)=>{
    const {page=1,limit=10} = req.query
    const pipeline = [
        {
            $match:{
                owner:new mongoose.Types.ObjectId(req.user._id)
            }
        },
        {
            $sort:{
                createdAt:-1
            }
        }
    ]
    const options ={
        page:Number(page),
        limit:Number(limit)
    }
  
    const result = await Video.aggregatePaginate(
        Video.aggregate(pipeline),options
    )
    return res.status(200).json(
        new apiResponse(200,result,"Channel videos fetched successfully")
    )
 })
export{getChannelStats,getChannelVideos}