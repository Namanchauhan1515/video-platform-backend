import {Playlist} from "../models/playlist.model.js"
import apiError from "../utils/apiError.js"
import apiResponse from "../utils/apiResponse.js"
import asyncHandler from "../utils/asyncHandler.js"
import mongoose, { isValidObjectId } from "mongoose";

const createPlaylist = asyncHandler(async(req,res)=>{
    const {name,discription} = req.body
    if(!name.trim() || !discription.trim()){
        throw new apiError(400,"Name and discription are required")

    }
    const userId = req.user._id

    if(!userId){
        throw new apiError(400,"User not found")
    }
    const playlist = await Playlist.create({
        name: name.trim(),
        description: discription.trim(),
        owner: userId,
        videos: []
    })
    if(!playlist){
        throw new apiError(500,"Playlist not created")
    }
    res.status(201).json
    (new apiResponse(201, playlist, "Playlist created successfully"))
})

const getAllPlaylist = asyncHandler(async(req,res)=>{
  const userId = req.user._id
  if(!userId){
    throw new apiError(400,"User not found")
  }
  const playlists = await Playlist.find({owner:userId}).populate("videos").populate("owner","name email")
//   if(!playlists){
//     throw new apiError(404,"No playlists found")
//   }
  return res.status(200).json(new apiResponse(200,playlists,"Playlists fetched successfully"))
})
 const getPlaylistById = asyncHandler(async(req,res)=>{
  const {playlistId} = req.params
if(!playlistId){
    throw new apiError(400,"playListId is reuired")
}
const playlist = await Playlist.findById(playlistId).populate("videos").populate("owner","name email")
if(!playlist){
    throw new apiError(404,"Playlist not found")

}

return res.status(200).json(new apiResponse(200,playlist,"Playlist fetched successfully"))
 })

const addVideoToPlaylist = asyncHandler(async(req,res)=>{
const {playlistId,videoId} = req.params
if(!isValidObjectId(playlistId) || !isValidObjectId(videoId)){
    throw new apiError(400,"Invalid playlistId or videoId")
}
const playList = await Playlist.findById(playlistId)
if(!playList){
    throw new apiError(404,"playlist not found")

}
if(playList.videos.some((id)=>id.toString()===videoId)){
    throw new apiError(400,"Video already exists in the playlist")
}
playList.videos.push(videoId)
await playList.save()

return res.status(200).json(new apiResponse(200,playList,"Video added to playlist successfully"))
})
const removeVideoFromPlaylist = adsyncHandler(async(req,res)=>{
    const {playlistId,videoId} = req.params
    if (!isValidObjectId(playlistId)||!isValidObjectId(videoId)){
        throw new apiError(400,"Invalid playlistId or videoId")

    }
    const playlist = await Playlist.findById(playlistId)
    if(!playlist){
        throw new apiError(404,"playlist not found")
    }
    if(!playlist.videos.some((id)=>id.toString()===videoId)){
        throw new apiError(400,"Video not found in the playlist")
    }
    playlist.videos = playlist.videos.filter((id)=>id.toString()!==videoId)
    await playlist.save()
    return res.status(200).json(new apiResponse(200,playlist,"Video removed from playlist successfully"))

})
const deletePlaylist = asyncHandler(async (req, res) => {
    const {playlistId} = req.params
    // TODO: delete playlist
    if(!mongoose.isValidObjectId(playlistId)){
        throw new apiError(400,"playlist is not found")
    }
    const playlist =  await Playlist.findById(playlistId)
    if(!playlist){
        throw new apiError(404,"playlist not found")
    }
await Playlist.findByIdAndDelete(playlist._id)
    return res.status(200,{},"playlist delete successfully")
})
const updatePlaylist = asyncHandler(async (req, res) => {
    const {playlistId,videoId} = req.params
    const {name, description} = req.body

    if(!name.trim() || !description.trim())
    //TODO: update playlist
    if(!mongoose.isValidObjectId(playlistId)){
        throw new apiError(400,"playlist is not found")
    }
    const playlist = await Playlist.findOne({
        _id: playlistId,
        owner: req.user._id
    });
    if(!playlist){
        throw new apiError(404,"playlist not found")
    }
     const playlistUpdate = await Playlist.findByIdAndUpdate(
        playlistId,{
            $set:{
                name:name.trin(),
                description:description.trim()

            }
        },{
            new:true,
            runValidators:true
        }
     )
     if(!playlistUpdate){
        throw new apiError(500,"playlist is not update")
     }
     return res.status(200).json(
        new apiResponse(200,playlistUpdate,"playlist is update successfully")
     )
})
export {createPlaylist,
getAllPlaylist,
getPlaylistById,
addVideoToPlaylist,
removeVideoFromPlaylist,
deletePlaylist,updatePlaylist
}


