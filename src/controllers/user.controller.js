import { asyncHandler } from '../utils/asyncHandler.js';
import {ApiError} from '../utils/ApiError.js'
import {User} from '../models/user.model.js'
import {uploadOnCloudinary} from '../utils/cloudinary.js';
import {ApiResponse} from '../utils/ApiResponse.js'

const registerUser = asyncHandler(async (req, res) => {
    // get user details from frontend.
    // validation - not empty
    // check if user already exists: email, username
    // check for images, check for avatar
    // upload them to cloudinary, avatar
    // create user object - create entry in db
    // remove password and refresh token field from response
    // check for user creation
    // return response


    const {fullname,email,username,password} = req.body
    console.log("fullname: ", fullname);


   
 // validation - not empty
    if(
        [fullname, email, username, password].some((field) => field?.trim() === "") 

    )   {

        throw new ApiError("All fields are required", 400)

    }


 // checks if  user is already exists with : email, username   
    const existedUser = User.findOne({
        $or:[ { email }, { username } ]
    })

    if(existedUser){
        throw new ApiError("User already exists with this email or username", 409)
    }

 // check for images, check for avatar    
    const avatarLocalPath = req.files?.avatar[0]?.path;
    const coverImageLocalPath = req.files?.coverImage[0]?.path;
    
    if(!avatarLocalPath) {
        throw new ApiError("Avatar file is required", 400)
    }

    // upload them to cloudinary, avatar
    const avatar = await uploadOnCloudinary(avatarLocalPath)

    if(!avatar) {
        throw new ApiError("Avatar file is required", 400)
    }

    const coverImage = await uploadOnCloudinary(coverImageLocalPath)


    // create user object - create entry in db
    const user = await User.create({
        fullname,
        avatar: avatar.url,
        coverImage:coverImage?.url || "", //this checks that if cover image is there then only assign the url otherwise assign empty string
        email,
        username: username.toLowerCase(),
        password
    })

    const createdUser = await User.findById(user._id).select(
        "-password -refereshToken"
    ) // '.select'  method is used to remove the password and refresh token from the response

    // check for user creation
    if(!createdUser){
        throw new ApiError("User creation failed", 500)
    }

    // return response
    return res.status(201).json(
        new ApiResponse(200, createdUser, "User registered successfully")
    )





} )

export { 
    registerUser,
}