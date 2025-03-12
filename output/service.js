var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
import { Service } from "typedi";
import { client } from "@tsdiapi/prisma";
import { toDTO } from "@tsdiapi/server";
import { IsEnum, IsNumber, IsOptional, IsString } from "class-validator";
import { Expose } from "class-transformer";
import sharp from "sharp";
export const createThumbnail = async (buffer, size) => {
    const image = sharp(buffer);
    const metadata = await image.metadata();
    const originalWidth = metadata.width || 0;
    const thumbnailWidth = Math.min(size, originalWidth);
    const thumbnailBuffer = await sharp(buffer)
        .resize({
        width: thumbnailWidth,
        fit: 'inside',
        withoutEnlargement: true,
    })
        .toBuffer();
    return thumbnailBuffer;
};
const model = (model) => (model in client) ? client[model] : null;
export var MediaType;
(function (MediaType) {
    MediaType["IMAGE"] = "IMAGE";
    MediaType["VIDEO"] = "VIDEO";
    MediaType["DOCUMENT"] = "DOCUMENT";
    MediaType["OTHER"] = "OTHER";
})(MediaType || (MediaType = {}));
const getImageMeta = async (buffer) => {
    const metadata = await sharp(buffer).metadata();
    return {
        width: metadata.width,
        height: metadata.height,
        format: metadata.format
    };
};
export class OutputMediaDTO {
    id;
    width;
    height;
    type;
    name;
    filesize;
    s3bucket;
    s3region;
    mimetype;
    url;
    key;
}
__decorate([
    IsString(),
    Expose(),
    __metadata("design:type", String)
], OutputMediaDTO.prototype, "id", void 0);
__decorate([
    IsOptional(),
    IsNumber(),
    __metadata("design:type", Number)
], OutputMediaDTO.prototype, "width", void 0);
__decorate([
    IsOptional(),
    IsNumber(),
    __metadata("design:type", Number)
], OutputMediaDTO.prototype, "height", void 0);
__decorate([
    IsEnum(MediaType),
    Expose(),
    __metadata("design:type", String)
], OutputMediaDTO.prototype, "type", void 0);
__decorate([
    IsString(),
    Expose(),
    IsOptional(),
    __metadata("design:type", String)
], OutputMediaDTO.prototype, "name", void 0);
__decorate([
    IsNumber(),
    Expose(),
    __metadata("design:type", Number)
], OutputMediaDTO.prototype, "filesize", void 0);
__decorate([
    IsString(),
    Expose(),
    __metadata("design:type", String)
], OutputMediaDTO.prototype, "s3bucket", void 0);
__decorate([
    IsString(),
    Expose(),
    __metadata("design:type", String)
], OutputMediaDTO.prototype, "s3region", void 0);
__decorate([
    IsString(),
    Expose(),
    IsOptional(),
    __metadata("design:type", String)
], OutputMediaDTO.prototype, "mimetype", void 0);
__decorate([
    IsString(),
    Expose(),
    __metadata("design:type", String)
], OutputMediaDTO.prototype, "url", void 0);
__decorate([
    IsString(),
    Expose(),
    IsOptional(),
    __metadata("design:type", String)
], OutputMediaDTO.prototype, "key", void 0);
let MediaService = class MediaService {
    deleteFunc;
    uploadFunc;
    onUpload;
    previewSize = 512;
    constructor() { }
    setOnUploadFunc(func) {
        this.onUpload = func;
    }
    setDeleteFunc(func) {
        this.deleteFunc = func;
    }
    setUploadFunc(func) {
        this.uploadFunc = func;
    }
    setPreviewSize(size) {
        this.previewSize = size;
    }
    getMediaType(mimetype) {
        if (mimetype.includes("image")) {
            return MediaType.IMAGE;
        }
        if (mimetype.includes("video")) {
            return MediaType.VIDEO;
        }
        if (mimetype.includes("application")) {
            return MediaType.DOCUMENT;
        }
        return MediaType.OTHER;
    }
    async deleteMedia(mediaId) {
        try {
            const db = model('media');
            if (!db) {
                console.log('media table not found');
                return false;
            }
            const media = await db.findUnique({
                where: {
                    id: mediaId,
                },
                include: {
                    media: true
                }
            });
            if (!media) {
                return false;
            }
            try {
                if (media.key) {
                    await this.deleteFunc(media?.key, media?.isPrivate);
                }
                await db.delete({
                    where: {
                        id: mediaId
                    }
                });
            }
            catch (error) {
                console.log(error);
            }
            if (media.media?.length) {
                for (const m of media.media) {
                    try {
                        if (m.key) {
                            await this.deleteMedia(m?.id);
                        }
                    }
                    catch (error) {
                        console.log(error);
                    }
                }
            }
            return true;
        }
        catch (error) {
            return false;
        }
    }
    async uploadFile(userId, file, isPrivate = false, name) {
        try {
            const db = model('media');
            if (!db) {
                console.log('media table not found');
                return null;
            }
            const result = await this.uploadFunc(file, isPrivate);
            if (!result?.url) {
                console.log('Upload function did not return a URL, which is mandatory');
                return null;
            }
            const data = {
                key: result.key || null,
                name: name || result.name || file.originalname,
                url: result.url,
                s3bucket: result.bucket || null,
                s3region: result.region || null,
                filesize: file.size || 0,
                mimetype: file.mimetype || null,
                type: this.getMediaType(file.mimetype)
            };
            let thumbnail, thumbnailMeta;
            if (data.type === MediaType.IMAGE) {
                const meta = await getImageMeta(file.buffer);
                data.width = meta.width;
                data.height = meta.height;
                data.format = meta.format;
                const buffer = file.buffer;
                const { thumbnailBuffer } = await createThumbnail(buffer, this.previewSize);
                thumbnail = await this.uploadFunc({
                    buffer: thumbnailBuffer,
                    mimetype: file.mimetype,
                    originalname: file.originalname
                }, isPrivate);
                thumbnailMeta = await getImageMeta(thumbnailBuffer);
            }
            else {
                const format = file.mimetype.split('/')[1];
                if (format) {
                    data.format = format;
                }
            }
            if (thumbnail) {
                thumbnail = {
                    ...data,
                    ...thumbnail,
                    name: `${data.name}-thumbnail`,
                    type: MediaType.IMAGE,
                    width: thumbnailMeta.width,
                    height: thumbnailMeta.height,
                    format: thumbnailMeta.format
                };
            }
            const media = await db.create({
                data: {
                    ...data,
                    ...(thumbnail ? {
                        media: {
                            create: thumbnail
                        }
                    } : {}),
                    user: {
                        create: {
                            userId: userId
                        }
                    }
                }
            });
            try {
                if (this.onUpload) {
                    this.onUpload(file, isPrivate, result);
                }
            }
            catch (error) {
                console.log(error);
            }
            return toDTO(OutputMediaDTO, media);
        }
        catch (error) {
            console.log(error);
            return null;
        }
    }
    async uploadFiles(userId, files, isPrivate = false) {
        try {
            const results = [];
            for (const file of files) {
                const result = await this.uploadFile(userId, file, isPrivate);
                if (result) {
                    results.push(result);
                }
            }
            return results;
        }
        catch (error) {
            console.log(error);
            return null;
        }
    }
};
MediaService = __decorate([
    Service(),
    __metadata("design:paramtypes", [])
], MediaService);
export { MediaService };
//# sourceMappingURL=service.js.map