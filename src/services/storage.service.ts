import { config } from '../config/index.js';
import { supabase } from '../lib/supabase.js';
import { AppError } from '../utils/errors.js';

export interface UploadFileOptions {
    bucket?: string;
    public?: boolean;
    metadata?: Record<string, any>;
}

export interface UploadedFile {
    path: string;
    url: string;
    bucket: string;
}

export class StorageService {
    /**
     * Check if storage is enabled
     */
    isStorageEnabled(): boolean {
        return config.ENABLE_STORAGE;
    }

    /**
     * Upload file to Supabase Storage
     */
    async uploadFile(
        file: {
            buffer: Buffer;
            originalname: string;
            mimetype: string;
            size: number;
        },
        options: UploadFileOptions = {}
    ): Promise<UploadedFile> {
        if (!this.isStorageEnabled()) {
            throw new AppError('Storage is disabled', 403, 'STORAGE_DISABLED');
        }

        // Validate file size
        if (file.size > config.MAX_FILE_SIZE) {
            throw new AppError(
                `File size exceeds maximum of ${config.MAX_FILE_SIZE / 1024 / 1024}MB`,
                400,
                'FILE_TOO_LARGE'
            );
        }

        const bucket = options.bucket || config.STORAGE_BUCKET_NAME;
        const fileName = this.generateFileName(file.originalname);
        const filePath = `${Date.now()}-${fileName}`;

        try {
            // Upload file to Supabase
            const { error } = await supabase.storage
                .from(bucket)
                .upload(filePath, file.buffer, {
                    contentType: file.mimetype,
                    metadata: options.metadata
                });

            if (error) {
                throw error;
            }

            // Get public URL if specified
            const url = options.public
                ? supabase.storage.from(bucket).getPublicUrl(filePath).data.publicUrl
                : filePath;

            return {
                path: filePath,
                url,
                bucket
            };
        } catch (error: any) {
            throw new AppError(
                `Failed to upload file: ${error.message}`,
                500,
                'UPLOAD_FAILED'
            );
        }
    }

    /**
     * Upload user avatar
     */
    async uploadAvatar(
        userId: string,
        file: {
            buffer: Buffer;
            originalname: string;
            mimetype: string;
            size: number;
        }
    ): Promise<UploadedFile> {
        // Validate file type
        if (!file.mimetype.startsWith('image/')) {
            throw new AppError('Only image files are allowed', 400, 'INVALID_FILE_TYPE');
        }

        const fileName = `avatar-${userId}-${Date.now()}.${this.getFileExtension(file.originalname)}`;

        try {
            const { error } = await supabase.storage
                .from(config.STORAGE_BUCKET_NAME)
                .upload(`avatars/${fileName}`, file.buffer, {
                    contentType: file.mimetype,
                    metadata: { userId, type: 'avatar' }
                });

            if (error) {
                throw error;
            }

            const url = supabase.storage
                .from(config.STORAGE_BUCKET_NAME)
                .getPublicUrl(`avatars/${fileName}`).data.publicUrl;

            return {
                path: `avatars/${fileName}`,
                url,
                bucket: config.STORAGE_BUCKET_NAME
            };
        } catch (error: any) {
            throw new AppError(
                `Failed to upload avatar: ${error.message}`,
                500,
                'UPLOAD_FAILED'
            );
        }
    }

    /**
     * Delete file from storage
     */
    async deleteFile(filePath: string, bucket?: string): Promise<void> {
        if (!this.isStorageEnabled()) {
            throw new AppError('Storage is disabled', 403, 'STORAGE_DISABLED');
        }

        const storageBucket = bucket || config.STORAGE_BUCKET_NAME;

        try {
            const { error } = await supabase.storage
                .from(storageBucket)
                .remove([filePath]);

            if (error) {
                throw error;
            }
        } catch (error: any) {
            throw new AppError(
                `Failed to delete file: ${error.message}`,
                500,
                'DELETE_FAILED'
            );
        }
    }

    /**
     * Delete multiple files
     */
    async deleteFiles(filePaths: string[], bucket?: string): Promise<void> {
        if (!this.isStorageEnabled()) {
            throw new AppError('Storage is disabled', 403, 'STORAGE_DISABLED');
        }

        const storageBucket = bucket || config.STORAGE_BUCKET_NAME;

        try {
            const { error } = await supabase.storage
                .from(storageBucket)
                .remove(filePaths);

            if (error) {
                throw error;
            }
        } catch (error: any) {
            throw new AppError(
                `Failed to delete files: ${error.message}`,
                500,
                'DELETE_FAILED'
            );
        }
    }

    /**
     * Get public URL for a file
     */
    getPublicUrl(filePath: string, bucket?: string): string {
        const storageBucket = bucket || config.STORAGE_BUCKET_NAME;
        return supabase.storage.from(storageBucket).getPublicUrl(filePath).data.publicUrl;
    }

    /**
     * Get signed URL for temporary access
     */
    async getSignedUrl(
        filePath: string,
        expiresIn: number = 3600, // 1 hour
        bucket?: string
    ): Promise<string> {
        if (!this.isStorageEnabled()) {
            throw new AppError('Storage is disabled', 403, 'STORAGE_DISABLED');
        }

        const storageBucket = bucket || config.STORAGE_BUCKET_NAME;

        try {
            const { data, error } = await supabase.storage
                .from(storageBucket)
                .createSignedUrl(filePath, expiresIn);

            if (error) {
                throw error;
            }

            return data.signedUrl;
        } catch (error: any) {
            throw new AppError(
                `Failed to generate signed URL: ${error.message}`,
                500,
                'SIGNED_URL_FAILED'
            );
        }
    }

    /**
     * Generate unique file name
     */
    private generateFileName(originalName: string): string {
        const timestamp = Date.now();
        const random = Math.random().toString(36).substring(2, 8);
        const extension = this.getFileExtension(originalName);
        return `${timestamp}-${random}.${extension}`;
    }

    /**
     * Get file extension
     */
    private getFileExtension(fileName: string): string {
        return fileName.split('.').pop()?.toLowerCase() || 'bin';
    }
}

export const storageService = new StorageService();
