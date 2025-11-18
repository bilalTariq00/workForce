import { v2 as cloudinary } from 'cloudinary';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { existsSync } from 'fs';

/**
 * File Upload Service
 * 
 * Supports multiple storage backends:
 * 1. Cloudinary (cloud storage - recommended)
 * 2. Local file storage (fallback)
 * 
 * Configure via environment variables:
 * - CLOUDINARY_CLOUD_NAME
 * - CLOUDINARY_API_KEY
 * - CLOUDINARY_API_SECRET
 * - FILE_STORAGE_TYPE (cloudinary | local)
 */

// Configure Cloudinary if credentials are provided
// Support both individual credentials and CLOUDINARY_URL format
if (process.env.CLOUDINARY_URL) {
  // Use CLOUDINARY_URL format: cloudinary://api_key:api_secret@cloud_name
  cloudinary.config({
    url: process.env.CLOUDINARY_URL,
  });
} else if (
  process.env.CLOUDINARY_CLOUD_NAME &&
  process.env.CLOUDINARY_API_KEY &&
  process.env.CLOUDINARY_API_SECRET
) {
  // Use individual credentials
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
  });
}

/**
 * Upload file to Cloudinary
 * 
 * @param {Buffer} fileBuffer - File buffer
 * @param {string} filename - Original filename
 * @param {string} folder - Cloudinary folder (e.g., 'certifications', 'incidents')
 * @param {string} resourceType - 'image' or 'raw' (for PDFs)
 * @returns {Promise<{url: string, publicId: string}>}
 */
async function uploadToCloudinary(fileBuffer, filename, folder, resourceType = 'auto') {
  return new Promise((resolve, reject) => {
    const uploadOptions = {
      folder: `workforce/${folder}`,
      resource_type: resourceType === 'pdf' ? 'raw' : 'auto',
      public_id: filename.replace(/\.[^/.]+$/, ''), // Remove extension
      overwrite: false,
    };

    const uploadStream = cloudinary.uploader.upload_stream(
      uploadOptions,
      (error, result) => {
        if (error) {
          reject(error);
        } else {
          resolve({
            url: result.secure_url,
            publicId: result.public_id,
            format: result.format,
          });
        }
      }
    );

    uploadStream.end(fileBuffer);
  });
}

/**
 * Upload file to local storage
 * 
 * @param {Buffer} fileBuffer - File buffer
 * @param {string} filename - Filename
 * @param {string} folder - Local folder (e.g., 'certifications', 'incidents')
 * @returns {Promise<{url: string}>}
 */
async function uploadToLocal(fileBuffer, filename, folder) {
  const uploadsDir = join(process.cwd(), 'public', 'uploads', folder);
  
  if (!existsSync(uploadsDir)) {
    await mkdir(uploadsDir, { recursive: true });
  }

  const filePath = join(uploadsDir, filename);
  await writeFile(filePath, fileBuffer);

  return {
    url: `/uploads/${folder}/${filename}`,
  };
}

/**
 * Main upload function
 * 
 * @param {File|Buffer} file - File object or buffer
 * @param {string} folder - Storage folder
 * @param {object} options - Upload options
 * @returns {Promise<{url: string, publicId?: string, format?: string}>}
 */
export async function uploadFile(file, folder, options = {}) {
  const storageType = process.env.FILE_STORAGE_TYPE || 'cloudinary';
  const maxSize = options.maxSize || 5 * 1024 * 1024; // 5MB default

  // Convert file to buffer if needed
  let fileBuffer;
  let filename;
  let mimeType;

  if (file instanceof File) {
    // Validate file size
    if (file.size > maxSize) {
      throw new Error(`File size exceeds ${maxSize / 1024 / 1024}MB limit`);
    }

    const bytes = await file.arrayBuffer();
    fileBuffer = Buffer.from(bytes);
    filename = file.name;
    mimeType = file.type;
  } else {
    fileBuffer = file;
    filename = options.filename || `file_${Date.now()}`;
    mimeType = options.mimeType || 'application/octet-stream';
  }

  // Generate unique filename
  const timestamp = Date.now();
  const randomString = Math.random().toString(36).substring(2, 15);
  const extension = filename.split('.').pop() || 'bin';
  const uniqueFilename = `${folder}_${timestamp}_${randomString}.${extension}`;

  // Determine resource type for Cloudinary
  const resourceType = mimeType === 'application/pdf' ? 'pdf' : 'image';

  try {
    // Try Cloudinary first if configured
    const cloudinaryConfigured = 
      process.env.CLOUDINARY_URL || 
      (process.env.CLOUDINARY_CLOUD_NAME && process.env.CLOUDINARY_API_KEY);
    
    if (storageType === 'cloudinary' && cloudinaryConfigured) {
      try {
        const result = await uploadToCloudinary(
          fileBuffer,
          uniqueFilename,
          folder,
          resourceType
        );
        return result;
      } catch (error) {
        console.warn('Cloudinary upload failed, falling back to local storage:', error);
        // Fall back to local storage
        return await uploadToLocal(fileBuffer, uniqueFilename, folder);
      }
    } else {
      // Use local storage
      return await uploadToLocal(fileBuffer, uniqueFilename, folder);
    }
  } catch (error) {
    console.error('File upload error:', error);
    throw new Error(`Failed to upload file: ${error.message}`);
  }
}

/**
 * Delete file from Cloudinary
 * 
 * @param {string} publicId - Cloudinary public ID
 * @returns {Promise<void>}
 */
export async function deleteFromCloudinary(publicId) {
  const cloudinaryConfigured = 
    process.env.CLOUDINARY_URL || 
    (process.env.CLOUDINARY_CLOUD_NAME && process.env.CLOUDINARY_API_KEY);
  
  if (!cloudinaryConfigured) {
    return; // Cloudinary not configured
  }

  try {
    await cloudinary.uploader.destroy(publicId);
  } catch (error) {
    console.error('Error deleting from Cloudinary:', error);
    // Don't throw - file might not exist
  }
}

/**
 * Delete file from local storage
 * 
 * @param {string} url - File URL (e.g., /uploads/certifications/file.jpg)
 * @returns {Promise<void>}
 */
export async function deleteFromLocal(url) {
  const { unlink } = await import('fs/promises');
  const { join } = await import('path');

  try {
    // Remove /uploads/ prefix and get file path
    const relativePath = url.replace(/^\/uploads\//, '');
    const filePath = join(process.cwd(), 'public', 'uploads', relativePath);
    await unlink(filePath);
  } catch (error) {
    console.error('Error deleting local file:', error);
    // Don't throw - file might not exist
  }
}

/**
 * Delete file (handles both Cloudinary and local)
 * 
 * @param {string} url - File URL
 * @param {string} publicId - Cloudinary public ID (optional)
 * @returns {Promise<void>}
 */
export async function deleteFile(url, publicId = null) {
  if (publicId && process.env.CLOUDINARY_CLOUD_NAME) {
    await deleteFromCloudinary(publicId);
  } else if (url.startsWith('/uploads/')) {
    await deleteFromLocal(url);
  }
}

