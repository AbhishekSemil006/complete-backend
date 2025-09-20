import { asyncHandler } from '../utils/asyncHandler.js';
import {ApiError} from '../utils/apiError.js'
import {User} from '../models/user.model.js'
import {uploadOnCloudinary} from '../utils/cloudinary.js';
import {ApiResponse} from '../utils/ApiResponse.js';
import jwt from "jsonwebtoken";


const generateAccessAndRefreshTokens = async(userId) =>
{
    try{
        const user = await User.findById(userId)
        const accessToken =  user.generateAccessToken()
        const refreshToken =  user.generateRefreshToken()

        user.refreshToken = refreshToken
        await user.save({validateBeforeSave: false })

        return {accessToken, refreshToken}



    } catch(error){
        throw new ApiError(500, "Something went wrong while generating refresh and access token")
    }
}


//register user.
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
    const existedUser = await User.findOne({
        $or:[ { email }, { username } ]
    })

    if(existedUser){
        throw new ApiError("User already exists with this email or username", 409)
        
    }
    // console.log(req.files);

 // check for images, check for avatar    
    const avatarLocalPath = req.files?.avatar?.[0]?.path;
    // const coverImageLocalPath = req.files?.coverImage?.[0]?.path;
    
    let coverImageLocalPath;
    if(req.files && Array.isArray(req.files.coverImage) && req.files.coverImage.length > 0 ) {
        coverImageLocalPath = req.files.coverImage[0].path;
    }

    
    if(!avatarLocalPath) {
        throw new ApiError("Avatar file is required", 400);
    }

    // upload them to cloudinary, avatar
    const avatar = await uploadOnCloudinary(avatarLocalPath);
    

    if(!avatar?.url) {
        throw new ApiError("Avatar file is required", 400)
    }

    const coverImage =  await uploadOnCloudinary(coverImageLocalPath)


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

//login user.
const loginUser = asyncHandler(async (req, res) => {
    // get user details from frontend.
    // validation not empty.
    // eamil,password - validation.
    //check if user exists.
    //check for email and password is correct.  
    //generate access and refresh token.
    //send cookies.
    //return response.
    const {email, username, password} = req.body

    if(!username && !email) {
        throw new ApiError(400,"username or email is required")    
    }
     
    const user = await User.findOne({
        $or: [{username}, {email}]
    })

    if(!user) {
        throw new ApiError(404, "User not found,")
    }
    
    const isPasswordCorrect = await user.isPasswordCorrect(password)

    if(!isPasswordCorrect) {
        throw new ApiError(401, "Password is incorrect")
    }

    const {accessToken, refreshToken} = await generateAccessAndRefreshTokens(user._id)

    const loggedInUser = await User.findById(user._id).select("-password -refreshToken")

    const options = {
        httpOnly: true,
        secure: true
    }

    return res
    .status(200)
    .cookie("accessToken", accessToken, options)
    .cookie("refreshToken", refreshToken, options)
    .json(
        new ApiResponse(
            200,
            {
                user: loggedInUser, accessToken, refreshToken
            },
            "User logged In Successfully"
        ) 
    )


})

//logout user.
const logoutUser = asyncHandler(async(req, res) => {
  await User.findByIdAndUpdate(
    req.user._id,
    {
        $set: {
            refreshToken: undefined
        }
    },
    {
        new: true
    }
  )

  const options = {
        httpOnly: true,
        secure: true
    }

    return res
    .status(200)
    .clearCookie("accessToken", options)
    .clearCookie("refreshToken", options)
    .json(new ApiResponse(200, {}, "User logged Out Successfully"))
})



const refreshAccessTOken = asyncHandler(async (req, res) => {
    const incomingRefreshToken = req.cookies.refreshToken || req.body.refreshToken

    if(!incomingRefreshToken) {
        throw new ApiError(401, "Unauthorise reques")
    }

    try {
        const decodedToken = jwt.verify(
            incomingRefreshToken,
            provess.env.REFRESH_TOKEN_SECRET
        )
    
        const user = await User.findById(decodedToken?._id)
    
        if(!user) {
            throw new ApiError(401, "Invalid refresh token")
        }
    
        if(incomingRefreshToken !== user?.refreshToken) {
            throw new ApiError(401,"Refresh token is expired")
        }
    
        const options = {
            httpOnly: true,
            secure: true
        }
    
        const {accessToken,newRefreshToken} = await generateAccessAndRefreshTokens(user._id)
    
        return res
        .status(200)
        .cookie("accessToken", accessToken, options)
        .cookie("refreshToken", newRefreshToken, options)
        .json(
            new ApiResponse(
                200,
                {accessToken, newRefreshToken},
                "Access token refreshed successfully"
            )
        )
    } catch (error) {
        throw new ApiError(401, error?.message || "Invalid refresh token")
    }

})



export { 
    registerUser,
    loginUser,
    logoutUser,
    refreshAccessTOken
}