import {v2 as cloudinary} from "cloudinary"
import { log } from "console";
import fs from "fs"


cloudinary.config({ 
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME, 
  api_key: process.env.CLOUDINARY_API_KEY, 
  api_secret: process.env.CLOUDINARY_API_SECRET 
});



const uploadOnCloudinary = async (localFilePath) => {
    try {
        if (!localFilePath) return null
        console.log(localFilePath);
        
        //upload the file on cloudinary
        const response = await cloudinary.uploader.upload(localFilePath, {
            resource_type: "auto",
            public_id: 'imagefile'
        })
        // file has been uploaded successfull
        // console.log("file is uploaded on cloudinary ", response);
        const public_id = response.public_id;
        fs.unlinkSync(localFilePath)
          // Optimize delivery by resizing and applying auto-format and auto-quality
    const optimizeUrl = cloudinary.url(public_id, {
        fetch_format: 'auto',
        quality: 'auto'
    });
    
    // console.log(optimizeUrl);
    
    // Transform the image: auto-crop to square aspect_ratio
    const autoCropUrl =   cloudinary.url(public_id, {
        crop: 'auto',
        gravity: 'auto',
        width: 500,
        height: 500,
    });
    
    return response;

    } catch (error) {
        console.log("error while uploading file on cloudinary ", error);
        fs.unlinkSync(localFilePath) // remove the locally saved temporary file as the upload operation got failed
        return null;
    }
}



export {uploadOnCloudinary}