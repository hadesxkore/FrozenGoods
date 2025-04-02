// Cloudinary configuration
export const CLOUDINARY_UPLOAD_PRESET = "ImageStorage";
export const CLOUDINARY_CLOUD_NAME = "dt7yizyhv";
export const CLOUDINARY_API_KEY = "166357216515988";
export const CLOUDINARY_UPLOAD_URL = `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`;

/**
 * Uploads an image to Cloudinary
 * @param {File} file - The image file to upload
 * @returns {Promise<string|null>} The URL of the uploaded image or null if failed
 */
export const uploadImageToCloudinary = async (file) => {
  if (!file) return null;

  try {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', CLOUDINARY_UPLOAD_PRESET);
    formData.append('api_key', CLOUDINARY_API_KEY);

    const response = await fetch(CLOUDINARY_UPLOAD_URL, {
      method: 'POST',
      body: formData
    });

    if (!response.ok) {
      throw new Error('Image upload failed');
    }

    const data = await response.json();
    return data.secure_url;
  } catch (error) {
    console.error("Error uploading image to Cloudinary:", error);
    return null;
  }
};

/**
 * Extracts the public ID from a Cloudinary URL
 * @param {string} url - Cloudinary URL
 * @returns {string|null} The public ID or null if not a valid Cloudinary URL
 */
export const getPublicIdFromUrl = (url) => {
  if (!url || typeof url !== 'string') return null;
  
  try {
    // Regular expression to extract public ID from Cloudinary URL
    const regex = /\/v\d+\/([^/]+)\.\w+$/;
    const match = url.match(regex);
    return match ? match[1] : null;
  } catch (error) {
    console.error("Error extracting public ID:", error);
    return null;
  }
}; 