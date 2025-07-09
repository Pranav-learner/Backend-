import { asyncHandler } from "../utils/asyncHandler.js";
import  ApiError from "../utils/ApiError.js"
import { User } from "../models/user.model.js";
import  uploadOnCloudinary  from "../utils/cloudinary.js";
import ApiResponose from "../utils/ApiResponse.js";


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
        new ApiResponose(200, createdUser, "User registered successfully")
    )
});

export { registerUser }