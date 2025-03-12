import "reflect-metadata";
import { MediaService } from "./service.js";
import { getS3Provider } from "@tsdiapi/s3";
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
        mediaService.setDeleteFunc(async (key, isPrivate) => {
            if (this.config.onDelete) {
                await this.config.onDelete(key, isPrivate);
            }
            getS3Provider().deleteFromS3(key).then(() => {
                console.log(`File ${key} deleted`);
            }).catch((error) => {
                console.log(`Error deleting file ${key}`, error);
            });
        });
        mediaService.setUploadFunc(async (file, isPrivate) => {
            try {
                const upload = await getS3Provider().uploadToS3(file, isPrivate);
                if (this.config.onUpload) {
                    await this.config.onUpload(file, isPrivate, upload);
                }
                return upload;
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
export default function createPlugin(config) {
    return new App(config);
}
//# sourceMappingURL=index.js.map