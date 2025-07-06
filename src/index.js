// important batie to be noted, remreber database is in another continent, so it will take time , so always use async and await
// whenever , connecting to database, problems may arise , to cope with that , always use try and catch, take promises adn catch errors
// require("dotenv").config({path: "./.env"}); , original way to get dotenv, but it is not module type(like import) , so we need to change it
import dotenv from "dotenv";
import app from "./app.js";
dotenv.config({
    path: "./.env"
});

import connectDB from "./db/index.js";
// this is a async method, so it will return a promise


connectDB().then(() => {
    app.on("error", (error) => {
        console.log("ERROR", error);
        throw error
    })

    app.listen(process.env.PORT || 8000, () => {
        console.log(`Listening on port ${process.env.PORT}`);
    })
}).catch((error) => {
    console.log("DB connection failed", error);
    process.exit(1);
})

/*first way to connect database

import express from "express";
const app = express();

//iffi function
(async () => {
    try {
        await mongoose.connect(`${process.env.MONGODB_URI}/${DB_NAME}`)
        app.on("error", (error) => {
            console.log("ERROR", error);
            throw error
        })

        app.listen(process.env.PORT, () => {
            console.log(`Listening on port ${process.env.PORT}`);
        })
    }catch (error) {
        console.log("ERROR", error);
        throw error
    }
})()*/