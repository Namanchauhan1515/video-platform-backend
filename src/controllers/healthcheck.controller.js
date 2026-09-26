import { asyncHandler } from "../utils/asyncHandler";

const healthcheck = asyncHandler(async(req,res)=>{
    return res.status(200).json(
        new apiResponse(  200,{},"Server is running successfull"))
})
export {healthcheck}