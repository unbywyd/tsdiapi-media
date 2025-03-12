import { MediaService } from "./service.js";
import { getS3Provider } from "@tsdiapi/s3";
import { Container } from "typedi";
export * from "./service.js";
class App {
    name = 'tsdiapi-media';
    config;
    context;
    constructor(config) {
        this.config = { ...config };
    }
    async onInit(ctx) {
        this.context = ctx;
        const mediaService = ctx.container.get(MediaService);
        const appConfig = ctx.config.appConfig || {};
        if (appConfig.previewSize) {
            this.config.previewSize = parseInt(appConfig.previewSize);
        }
        if ('MEDIA_PREVIEW_SIZE' in appConfig) {
            this.config.previewSize = parseInt(appConfig.MEDIA_PREVIEW_SIZE);
        }
        if (!this.config.previewSize) {
            this.config.previewSize = 512;
        }
        mediaService.setPreviewSize(this.config.previewSize);
        mediaService.setDeleteFunc(async (key, isPrivate) => {
            try {
                if (this.config.onDelete) {
                    await this.config.onDelete(key, isPrivate);
                }
            }
            catch (error) {
                console.error('Error onDelete', error);
            }
            const s3provider = getS3Provider();
            if (s3provider) {
                try {
                    await s3provider.deleteFromS3(key);
                }
                catch (error) {
                    console.error(`Error deleting file ${key}. Please check your S3 credentials and configuration.`, error);
                }
            }
            else {
                console.error('S3 provider not found. Please ensure the S3 plugin is passed to the tsdiapi application.');
            }
        });
        mediaService.setUploadFunc(async (file, isPrivate) => {
            try {
                const s3provider = getS3Provider();
                if (!s3provider) {
                    console.error('S3 provider not found. Please ensure the S3 plugin is passed to the tsdiapi application.');
                    return null;
                }
                try {
                    const upload = await s3provider.uploadToS3(file, isPrivate);
                    if (this.config.onUpload) {
                        await this.config.onUpload(file, isPrivate, upload);
                    }
                    return upload;
                }
                catch (error) {
                    console.error('Error uploading file', error);
                    return null;
                }
            }
            catch (error) {
                console.log('Error uploading file', error);
                return null;
            }
        });
        if (this.config.onUpload) {
            mediaService.setOnUploadFunc(async (file, isPrivate, upload) => {
                try {
                    await this.config.onUpload(file, isPrivate, upload);
                }
                catch (error) {
                    console.log('Error onUpload', error);
                }
            });
        }
    }
}
export function getMediaProvider() {
    return Container.get(MediaService);
}
export default function createPlugin(config) {
    return new App(config);
}
//# sourceMappingURL=index.js.map