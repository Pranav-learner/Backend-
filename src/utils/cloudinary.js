import { v2 as cloudinary } from 'cloudinary';
import fs from 'fs';

    // Configuration
cloudinary.config({ 
        cloud_name: process.env.CLOUDINARY_CLOUD_NAME, 
        api_key:process.env.CLOUDINARY_API_KEY, 
        api_secret: process.env.CLOUDINARY_API_SECRET  
});

const uploadOnCloudinary = async (localfilePath) => {
    try {
        if (!localfilePath) return null;
        // upload on cloudinary
        const response = await cloudinary.uploader.upload(localfilePath, {
            resource_type: "auto",
        }); 
        // file has bee uploaded successfully
        console.log("File uploaded on cloudinary", response.url);
        return response
    } catch (error) {
        fs.unlinkSync(localfilePath); // remove the locally saved temporary
        // file as the upload operation failed
        throw error
    }
}

export default uploadOnCloudinary