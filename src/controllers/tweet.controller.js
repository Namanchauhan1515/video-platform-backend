import { apiError } from "../utils/apiError.js";
import { Tweet } from "../models/tweet.model.js";
import { apiResponse } from "../utils/apiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import mongoose from "mongoose";

// CREATE TWEET
const createTweet = asyncHandler(async (req, res) => {
    const userId = req.user?._id;
    const { content } = req.body;

    if (!userId) {
        throw new apiError(401, "Unauthorized request");
    }

    if (!content?.trim()) {
        throw new apiError(400, "Content is required");
    }

    const tweet = await Tweet.create({
        content: content.trim(),
        owner: userId
    });

    if (!tweet) {
        throw new apiError(500, "Tweet could not be created");
    }

    return res.status(201).json(
        new apiResponse(201, tweet, "Tweet created successfully")
    );
});


// GET LOGGED-IN USER'S TWEETS
const getUsersTweets = asyncHandler(async (req, res) => {
    const userId = req.user?._id;

    if (!userId) {
        throw new apiError(401, "Unauthorized request");
    }

    const tweets = await Tweet.find({ owner: userId });

    return res.status(200).json(
        new apiResponse(200, tweets, "User tweets fetched successfully")
    );
});


// UPDATE TWEET
const updateTweets = asyncHandler(async (req, res) => {
    const { tweetId } = req.params;
    const { content } = req.body;

    if (!mongoose.isValidObjectId(tweetId)) {
        throw new apiError(400, "Invalid tweet ID");
    }

    if (!content?.trim()) {
        throw new apiError(400, "Content is required");
    }

    const tweet = await Tweet.findOneAndUpdate(
        {
            _id: tweetId,
            owner: req.user?._id
        },
        {
            $set: {
                content: content.trim()
            }
        },
        {
            new: true,
            runValidators: true
        }
    );

    if (!tweet) {
        throw new apiError(404, "Tweet not found or unauthorized");
    }

    return res.status(200).json(
        new apiResponse(200, tweet, "Tweet updated successfully")
    );
});


// DELETE TWEET
const deleteTweet = asyncHandler(async (req, res) => {
    const { tweetId } = req.params;

    if (!mongoose.isValidObjectId(tweetId)) {
        throw new apiError(400, "Invalid tweet ID");
    }

    const tweet = await Tweet.findOneAndDelete({
        _id: tweetId,
        owner: req.user?._id
    });

    if (!tweet) {
        throw new apiError(404, "Tweet not found or unauthorized");
    }

    return res.status(200).json(
        new apiResponse(200, {}, "Tweet deleted successfully")
    );
});

export {
    createTweet,
    getUsersTweets,
    updateTweets,
    deleteTweet
};