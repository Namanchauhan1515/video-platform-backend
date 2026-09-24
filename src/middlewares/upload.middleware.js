import { upload } from "./multer.middlewares.js";
const uploadFields = upload.fields([
    {
        name:"avatar",
        maxCount:1
    },
     {
        name:"coverImage",
        maxCount:1
    }
])
export {uploadFields}