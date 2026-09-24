import connectDB from "./db/index.js";
import { app } from "./app.js";

connectDB()
    .then(() => {
        app.listen(process.env.PORT || 8080, () => {
            console.log(
                `Server is running at port ${process.env.PORT || 8080}`
            );
        });
    })
    .catch((error) => {
        console.log("MongoDB connection failed !!!", error);
    });