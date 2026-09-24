import { User } from "../models/users.models.js"
import { apiError } from "./apiError.js"

const generateAccessAndRefreshToken = async(userId)=>{
    try {
        const user = await User.findById(userId)
        const accessToken = user.genrateAccessToken()
        const refreshToken = user.genrateRefreshToken()
        user.refreshToken =refreshToken
        await user.save({validateBeforeSave:false})
        return {accessToken,refreshToken}
    } catch (error) {
        throw new apiError(500,"Something went wrong while genrating refresh and access token")
        
    }
}
export {generateAccessAndRefreshToken}