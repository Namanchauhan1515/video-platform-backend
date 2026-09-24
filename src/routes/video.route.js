import { Router } from "express";
import { getAllVideo } from "../controllers/video.controller.js";
const router = Router()
router.route("/get-video").get(getAllVideo)

export default router