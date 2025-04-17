import { useS3Provider } from "@tsdiapi/s3";
import { Container } from "typedi";
import MediaService from "./media.service.js";
import registerMetaRoutes from "./controller.js";
export * from "./media.service.js";
class App {
    name = 'tsdiapi-media';
    config;
    context;
    constructor(config) {
        this.config = { ...config };
    }
    async onInit(ctx) {
        const mediaService = Container.get(MediaService);
        this.context = ctx;
        const config = ctx.projectConfig;
        const previewSize = config.get("MEDIA_PREVIEW_SIZE", this.config.previewSize);
        if (previewSize) {
            this.config.previewSize = parseInt(previewSize);
        }
        if (!this.config.previewSize) {
            this.config.previewSize = 512;
        }
        mediaService.setPreviewSize(this.config.previewSize);
        mediaService.setGeneratePreview(this.config.generatePreview ?? true);
        mediaService.setDeleteFunc(async (key, isPrivate) => {
            const s3provider = useS3Provider();
            if (s3provider) {
                try {
                    await s3provider.deleteFromS3(key, isPrivate);
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
                const s3provider = useS3Provider();
                if (!s3provider) {
                    console.error('S3 provider not found. Please ensure the S3 plugin is passed to the tsdiapi application.');
                    return null;
                }
                try {
                    const upload = await s3provider.uploadToS3({
                        buffer: file.buffer,
                        mimetype: file.mimetype,
                        originalname: file.filename
                    }, isPrivate);
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
    }
    async preReady() {
        if (this.config.autoRegisterControllers) {
            await registerMetaRoutes(this.context);
        }
    }
}
export function useMediaProvider() {
    return Container.get(MediaService);
}
export default function createPlugin(config) {
    return new App(config);
}
//# sourceMappingURL=index.js.map