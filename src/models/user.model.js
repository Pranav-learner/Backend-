import mongoose, {Schema} from "mongoose";
import jwt from "jsonwebtoken"
import bcrypt from "bcrypt"

const userSchema = new Schema(
    {
        username: {
            type: String,
            required: true,
            unique: true,
            lowercase: true,
            trim: true, 
            index: true
        },
        email: {
            type: String,
            required: true,
            unique: true,
            lowecase: true,
            trim: true, 
        },
        fullName: {
            type: String,
            required: true,
            trim: true, 
            index: true
        },
        avatar: {
            type: String, // cloudinary url
            required: true,
        },
        coverImage: {
            type: String, // cloudinary url
        },
        watchHistory: [
            {
                type: Schema.Types.ObjectId,
                ref: "Video"
            }
        ],
        password: {
            type: String,
            required: [true, 'Password is required']
        },
        refreshToken: {
            type: String
        }

    },
    {
        timestamps: true
    }
)
// .pre middleware is used just before saving anything, we are encrypting just before saving
userSchema.pre("save", async function (next) { // yha pe arrow function usee mat karna , kyuki vo refrence nahi rakhega, but yha pe we need the functino which will be saved
    if(!this.isModified("password")) return next();

    this.password = await bcrypt.hash(this.password, 10)
    next()
})


// thid method we made , to know if the password is correct or not 
userSchema.methods.isPasswordCorrect = async function (password) {
    try {
        const ans = await bcrypt.compare(password, this.password)
        console.log(ans)
        return ans
    } catch (error) {
        throw new Error('Error comparing passwords')
}}

// JWT is a bearer token(the one who keeps it , that one will be the owner                      ) , which is a string which is used to authenticate the user

userSchema.methods.generateAccessToken = function(){
    return jwt.sign(
        {   // payload, data
            _id: this._id,
            email: this.email,
            username: this.username,
            fullName: this.fullName
        },
        process.env.ACCESS_TOKEN_SECRET,
        {
            expiresIn: process.env.ACCESS_TOKEN_EXPIRY
        }
    )
}
userSchema.methods.generateRefreshToken = function(){
    return jwt.sign(
        {
            _id: this._id,
            
        },
        process.env.REFRESH_TOKEN_SECRET,
        {
            expiresIn: process.env.REFRESH_TOKEN_EXPIRY
        }
    )
}

export const User = mongoose.model("User", userSchema)