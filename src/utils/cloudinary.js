import { v2 as cloudinary } from 'cloudinary';
import { log } from 'console';
import fs from 'fs';

(async function(localFilePath) {

    // Configuration
    cloudinary.config({ 
        cloud_name: process.env.cloud_name, 
        api_key: process.env.api_key, 
        api_secret: process.env.api_secret
    });
    
    // Upload an image
    try{
        if(!localFilePath) return null;
        const uploadResult = await cloudinary.uploader
        .upload(localFilePath, {
            resource_type: 'auto',
            public_id:'file_id'
        })
        console.log("file is uploaded successfully",uploadResult);
        
    } catch(error) {
        fs.unlinkSync(localFilePath) // remove the locally saved temporary file as the upload operation got failed
        console.error("Error during upload:", error);    
        return null;
    }

if (!uploadResult) {
    console.log("Upload failed. Exiting process...");
}

    
    console.log(uploadResult);
    
    // Optimize delivery by resizing and applying auto-format and auto-quality
    const optimizeUrl = cloudinary.url('file_id', {
        fetch_format: 'auto',
        quality: 'auto'
    });
    
    console.log(optimizeUrl);
    
    // Transform the image: auto-crop to square aspect_ratio
    const autoCropUrl = cloudinary.url('file_id', {
        crop: 'auto',
        gravity: 'auto',
        width: 500,
        height: 500,
    });
    
    console.log(autoCropUrl);    
})();