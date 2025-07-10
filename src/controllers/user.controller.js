import { asyncHandler } from "../utils/asyncHandler.js";
import  ApiError from "../utils/ApiError.js"
import { User } from "../models/user.model.js";
import  uploadOnCloudinary  from "../utils/cloudinary.js";
import ApiResponse from "../utils/ApiResponse.js";
import jwt from "jsonwebtoken"


const generateAccessAndRefereshTokens = async(userId) =>{
    try {
        const user = await User.findById(userId)
        const accessToken = user.generateAccessToken()
        const refreshToken = user.generateRefreshToken()

        user.refreshToken = refreshToken  // database me bhi save karna padega user ka refresh token siliye user ke referesh token ko update kia upar ka refreshtoken jo function se aaya
        await user.save({ validateBeforeSave: false }) // it will not validate before saving why because we want to save the refresh token, not the password
        // as while saving password will be hashed again and again whenever it is saved, and that we don't want

        return {accessToken, refreshToken}


    } catch (error) {
        throw new ApiError(500, "Something went wrong while generating referesh and access token")
    }
}

// Registeration

const registerUser = asyncHandler(async (req, res) => {
    // get user details from frontend
    // validation check if not empty
    // check if user exists
    // check for required stuff , compulsory walae part diye ki nahi
    //  upload them on cloudinary so that we can get the url
    // create user object - create entry in db 
    // remove password and refresh token field from response
    // check for user creation 
    // return response
    
    
// got details from user    
    const { fullName, email, username, password } = req.body
    

    // validation

    // following are code begginers write

    //  if (fullName === "" || email === "" || username === "" || password === "") {
    //      throw new ApiError("All fields are required", 400)
    // }
    // if (fullName === "") {
    //     throw new ApiError("Full name is required", 400)
    // }
    // if (email === "") {
    //     throw new ApiError("Email is required", 400)
    // }
    // if (username === "") {
    //     throw new ApiError("Username is required", 400)
    // }
    // if (password === "") {
    //     throw new ApiError("Password is required", 400)
    // }

    // how it is written by experinced ones
    if (
        [fullName, email, username, password].some((value) =>
            value?.trim() === "")
    ) {
        throw new ApiError("All fields are required", 400)
    }

    // check if  first user exists
    const existedUser = await User.findOne({ 
        $or: [      // to check multiple conditions
            { email },
            { username }
        ]
     })  // findOne is used to check if the user exists
    if (existedUser) {
        throw new ApiError(409,"User with email or username already exists")
    }


    const avatarLocalPath = req.files?.avatar[0]?.path;
    // const coverImageLocalPath = req.files?.coverImage[0]?.path;  // jab hum optional chaning karte hai like, here, and check nahi kar rhe
    // ki files exist hai ki nahi , jese hamne avatar ke just niche kiye but coverImage ke liye nahi kiya so, coverImageLocalPath will be undefined if user dosent upload coverImage
    // in that case an error will arise, to handle that we'll do following -> checking each and everything

    let coverImageLocalPath;
    if (req.files && Array.isArray(req.files.coverImage) && req.files.coverImage.length > 0) {
        coverImageLocalPath = req.files.coverImage[0].path;
    }


    if (!avatarLocalPath) {
        throw new ApiError("Avatar is required", 400)
    }
    
    const avatar = await uploadOnCloudinary(avatarLocalPath);
    const coverImage = await uploadOnCloudinary(coverImageLocalPath);

   
    
    if (!avatar) {
        throw new ApiError("Avatar upload failed", 400)
    }

    
    const user = await User.create({
        fullName,
        email,
        username : username.toLowerCase(),
        password,
        avatar: avatar.url,
        coverImage: coverImage?.url || "",
    })

    const createdUser = await User.findById(user._id).select("-password -refreshToken")
    if(!createdUser) {
        throw new ApiError("Something went wrong", 500)
    }

    return res.status(201).json(
        new ApiResponse(200, createdUser, "User registered successfully")
    )
});


/// LOGIN USER

const loginUser = asyncHandler( async(req, res)  => {
    // req body -> data
    //username or email se check karna
    // find the user
    // password check
    // access adn refresh token 
    // send cookies

    const { username, email, password } = req.body 

    if (!(username || email)){
        throw new ApiError(400,"Username or email is required")
    }

    const user = await User.findOne({
        $or: [{ username }, { email }]
    })
        
    if (!user) {
        throw new ApiError(404,"User not found")
    }

    const isPasswordValid = await user.isPasswordCorrect(password);

    if (!isPasswordValid) {
        throw new ApiError(401,"Invalid credentials ")
    }   

    const {accessToken, refreshToken} = await generateAccessAndRefereshTokens(user._id)


    const loggedInUser = await User.findById(user._id).select("-password -refreshToken")
    
    const options = {
        httpOnly: true, // cookie will be accessible only by the server
        secure: true, // it will only work in https, will be secured
    }

    return res
        .status(200)
        .cookie("accessToken", accessToken, options)
        .cookie("refreshToken", refreshToken, options)
        .json(
        new ApiResponse(200, loggedInUser, "User logged in successfully")
    )
})


// LOGOUT USER

const logoutUser = asyncHandler(async (req, res) => {
        
    // first of all remove the cookie fromm the server
    // and remove the refresh token to make the user logout
    await User.findByIdAndUpdate(
        req.user._id,
        {
            $unset: {
                refreshToken: 1  // to delete or remove use unset , and 1(as true) for which you are unsetting 
            }
        },
        {
            new: true
        }
    )

    const options = {
        httpOnly: true,
        secure: true, 
    }
    
    return res
        .status(200)
        .clearCookie("accessToken", options)
        .clearCookie("refreshToken", options)
        .json(new ApiResponse(200, {}, "User Logged Out successfully"))
    
})
    
// refreshAccessToken and AccessToken

const refreshAccessToken = asyncHandler(async (req, res) => {
    const incomingRefreshToken = req.cookies.refreshToken || req.body.refreshToken

    if(!incomingRefreshToken) {
        throw new ApiError(401, "Unauthorised request")
    }

    try {
        const decodedToken = jwt.verify(
            incomingRefreshToken,
            process.env.REFRESH_TOKEN_SECRET,
        )
    
        const user = User.findById(decodedToken._id)
    
        if(!user) {
            throw new ApiError(401, "Invalid refresh token")
        }
    
        if(incomingRefreshToken !== user?.refreshToken) {
            throw new ApiError(401, "Refresh token is expired or used")
        }
    
        const options = {
                httpOnly: true,
                secure: true
            }
        
        const {accessToken, newRefreshToken} = await generateAccessAndRefereshTokens(user._id)
        
            return res
            .status(200)
            .cookie("accessToken", accessToken, options)
            .cookie("refreshToken", newRefreshToken, options)
            .json(
                new ApiResponse(
                    200, 
                    {accessToken, refreshToken: newRefreshToken},
                    "Access token refreshed"
                )
            )
    } catch (error) {
        throw new ApiError(401, error?.message || "Invalid refresh token")
        
    }
        
})

// Change Password
const changeCurrentPassword = asyncHandler(async (req, res) => {
    const { oldPassword, newPassword } = req.body
    
    const user = await User.findById(req.user._id)
    
    if (!user) {
        throw new ApiError(404, "User not found")
    }
    
    const isPasswordValid = await user.isPasswordCorrect(oldPassword)
    
    if (!isPasswordValid) {
        throw new ApiError(400, "Invalid password")
    }
    
    user.password = newPassword
    await user.save({ validateBeforeSave: false })
    
    return res
        .status(200)
        .json(new ApiResponse(200, {}, "Password changed successfully"))
})

// current user

const getCurrentUser = asyncHandler(async (req, res) => {
     return res
        .status(200)
        .json(new ApiResponse(200, req.user, "Current user fetched successfully"))
})

// update user details

const updateAccountDetails = asyncHandler(async(req,res) => {
    const { fullName, email } = req.body
    
    if(!fullName || !email) {
        throw new ApiError(400, "All fields are required")
    }
    
    const user = await User.findByIdAndUpdate(req.user._id,
        {
            $set: {
                fullName,
                email
            }
        },
        {
            new: true
        }
    ).select("-password")
    
    return res
        .status(200)
        .json(new ApiResponse(200, user, "User details updated successfully"))
})

// Update Avatar

const updateUserAvatar = asyncHandler(async (req, res) => {
    const avatarLocalPath = req.file?.path

    if(!avatarLocalPath) {
        throw new ApiError(400, "Avatar is required")
    }

    const avatar = await uploadOnCloudinary(avatarLocalPath)

    if (!avatar.url) {
        throw new ApiError(400, "Avatar upload failed")
    }
    const user = await User.findByIdAndUpdate(req.user?._id,
        {
            $set: {
                avatar: avatar?.url
            }
        },
        {
            new: true
        }
    ).select("-password")
    
    return res
        .status(200)
        .json(new ApiResponse(200, user, "Avatar updated successfully"))
})

// Update CoverImage
const updateUserCoverIamge = asyncHandler(async (req, res) => {
    const coverImageLocalPath = req.file?.path

    if(!coverImageLocalPath) {
        throw new ApiError(400, "CoverImage is required")
    }

    const coverImage = await uploadOnCloudinary(coverImageLocalPath)

    if (!coverImage.url) {
        throw new ApiError(400, "CoverImage upload failed")
    }
    const user = await User.findByIdAndUpdate(req.user?._id,
        {
            $set: {
                coverImage: coverImage?.url
            }
        },
        {
            new: true
        }
    ).select("-password")
    
    return res
        .status(200)
        .json(new ApiResponse(200, user, "Cover Image  updated successfully"))
})


//gett user details

const getUserChannelprofile = asyncHandler(async(req, res) => {
    const { username } = req.params
    
    if(!username?.trim()) {
        throw new ApiError(400, "Username is missing")
    }
    
    const channel = await User.aggregate([
        {
            $match: {  // to match the data on common ground
                username: username?.toLowerCase()
            }
        },
        {
            $lookup: {
                from: "subscriptions",
                localField: "_id",
                foreignField: "channel",
                as: "subscribers"
            }
        },
        {
            $lookup: {  // to get the data from another collection
                from: "subscriptions",
                localField: "_id",
                foreignField: "subscriber",
                as: "subscribedTo"
            }
        },
        {
            $addFields: {   // to add extr fields to the data
                subscribersCount: {
                    $size: "$subscribers"
                },
                subscribedToCount: {
                    $size: "$subscribedTo"
                },
                isSubscribed: {
                    $cond: {
                        if: {
                            $in: [req.user?._id, "$subscribers.subscriber"]
                        },
                        then: true,
                        else: false
                    }
                }
            }
        },
        {
            $project: {    //  to show only these fields
                fullName: 1,
                username: 1,
                subscribersCount: 1,
                subscribedToCount: 1,
                isSubscribed: 1,
                avatar: 1,
                coverImage: 1,
                email: 1
            }
        }
    ])

    if(!channel?.length) {
        throw new ApiError(404, "Channel not found")
    }
    
    const user = channel[0]
    
    return res
        .status(200)
        .json(new ApiResponse(200, user, "User details fetched successfully"))
})


// users watch history
const getWatchHistory = asyncHandler(async (req, res) => {
    // req.user._id , ye kya deta hai?-> ek string deta hai jo id nahi hoti hai , uske pura ObjectId("string ") ye pura chaiye hota hai, ye mongoose ki help se mongodb me hojata hai

    const user = await User.aggregate([
        {
            $match: {
                _id: new mongoose.Types.ObjectId(req.user._id) // hame yha pe new object banna pda , string ko object me convert kia, kyuki mongoose yha pe kaam nahi karta diretly
            }
        },
        {
            $lookup: {
                from: "videos",
                localField: "watchHistory",
                foreignField: "_id",
                as: "watchHistory",
                pipeline: [
                    {
                        $lookup: {
                            from: "users",
                            localField: "owner",
                            foreignField: "_id",
                            as: "owner",
                            pipeline: [
                                {
                                    $project: {
                                        fullName: 1,
                                        username: 1,
                                        avatar: 1
                                    }
                                }
                            ]
                        }
                    },
                    {
                        $addFields: {
                            owner: {
                                $arrayElemAt: ["$owner", 0]
                            }
                        }
                    }
                ]   
            }
        }
    ])

    return res
        .status(200)
        .json(new ApiResponse(200, user[0]?.watchHistory, "Watch history fetched successfully"))
})


export {
    registerUser,
    loginUser,
    logoutUser,
    refreshAccessToken,
    changeCurrentPassword,
    getCurrentUser,
    updateAccountDetails,
    updateUserAvatar,
    updateUserCoverIamge,
    getUserChannelprofile,
    getWatchHistory
}