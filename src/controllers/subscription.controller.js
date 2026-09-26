import mongoose from "mongoose";
import { asyncHandler } from "../utils/asyncHandler";
import { apiError } from "../utils/apiError";
import { apiResponse } from "../utils/apiResponse";
import {Subscription} from "../models/subscriptions.model.js"
const toggleSubscription = asyncHandler(async(req,res)=>{
    const {channelId} = req.params
     const userId = req.user._id;
    if(!mongoose.isValidObjectId(channelId)){
        throw new apiError(400,"channel is required")
    }
        if (userId.toString() === channelId) {
        throw new apiError(400, "You cannot subscribe to your own channel");
    }

    const channel = await User.findById(channelId)
    if(!channel){
        throw new apiError(404,"channel is not found")
    }
    const existSubscription = await Subscription.findOne({
        subscriber:userId,
        channel:channelId
    }) 
    if(existSubscription){
        await Subscription.findByIdAndDelete(existSubscription._id)
    return res.status(200).json(
        new apiResponse(200,{},"unSubcribe successfully")
    )}

    
        const subscription = await Subscription.create({
            subscriber :userId,
            channel:channelId

        })
        return res.staus(200).json(new apiResponse(200,{subscription},"subscriber successfull"))
    
})
const getUserChannelSubscribers = asyncHandler(async(req,res)=>{
    const {channelId} = req.params
    const {page = 1, limit = 10} = req.query

     if(!mongoose.isValidObjectId(channelId)){
        throw new apiError(400,"channel is required")
    }
     const channel = await User.findById(channelId)
    if(!channel){
        throw new apiError(404,"channel is not found")
    }
    const pipeline = [
        {
            $match:{
                channel:new mongoose.Types.ObjectId(channelId)
            } 
        },{
            $sort:{
                createdAt:-1
            }
        },
        {
            $lookup:{
                from:"Users",
                localField:"subscriber",
                foreignField:"_id",
                as: "subscriberDetails"
            }
        },
        {
            $unwind: "$subscriberDetails"
        },
           {
            $project: {
                _id: 1,
                subscriber: "$subscriberDetails",
                channel: 1,
                createdAt: 1
            }
        }
    ]
    const options ={
        page:Number(page),
        limit:Number(limit)
    }
  
    const result = await Subscription.aggregatePaginate(
        Subscription.aggregate(pipeline),options
    )
    return res.status(200).json( new apiResponse(200,result,))
})
const getSubscribedChannels = asyncHandler(async (req, res) => {
    const { subscriberId } = req.params
    const {page=1,limit=10}= req.query
    if(!mongoose.isValidObjectId(subscriberId)){
        throw new apiError(400,"subscriberId is required")
    }
    const subscriber = await User.findById(subscriberId)
    if(!subscriber){
        throw new apiError(404,"subscriber not found")
    }
    const pipeline = [
        {
            $match:{
                subscriber:new mongoose.Types.ObjectId(subscriberId)
            }
        },
        {
            $sort:{
                createdAt:-1
            }
        },
        {
            $lookup:{
                from:"users",
                localField:"channel",
                foreignField:"_id",
                as:"channelDetail"

            }
    },
    {
        $unwind:"$channelDetail"
    },{
        $project:{
            _id: 1,
                subscriber: 1,
                channel: "$channelDetail",
                createdAt: 1
               
        }
        }
    ]
    const options={
        page:Number(page),
        limit:Number(limit),
    }
     const result = await Subscription.aggregatePaginate(
        Subscription.aggregate(pipeline),options
    ) 
    return res.status(200).json(
        new apiResponse(200,result,"Subscribed channels fetched successfully")
    )

})
export {toggleSubscription ,getUserChannelSubscribers,getSubscribedChannels}