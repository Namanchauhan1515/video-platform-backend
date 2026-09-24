import {v2 as cloudinary} from "cloudinary"
import { apiError } from "./apiError"
const deleteFromCloudinary = async(avatarUrl)=>{
   try {
    if(!avatarUrl){
        throw new apiError(400,"Error while deleteing file from cloudinary")
    }
            const publicId = avatarUrl
            .split("/upload/")[1]
            .replace(/^v\d+\//, "")
            .replace(/\.[^/.]+$/, "");

    const response = await cloudinary.uploader.destroy(publicId);
    
    return response;
    
   } catch (error) {
    console.log("Error while deleting file from Cloudinary:", error);
    return null;
    
   }
}
export {deleteFromCloudinary}