// 2ND WAT TO CONNECT DATABASE

import mongoose from "mongoose";
import { DB_NAME } from "../constants.js";

const connectDB = async () => {
    try {
        const connectionInstance = await mongoose.connect(`${process.env.MONGODB_URI}/${DB_NAME}`)
        console.log(`\n MongoDB connected  !! DB HOST : ${connectionInstance.connection.host}`  )
    }catch (error) {
        console.log("MONGODB connection FAILED", error);
        process.exit(1);   // instead of throwing the eroor , we can exit the process, process is reffering to the node process, which will be running on that time
    }
}

export default connectDB

// this is a async method, so it will return a promise