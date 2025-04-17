var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
import { Service } from "typedi";
import sharp from "sharp";
import { usePrisma } from "@tsdiapi/prisma";
import { MediaType } from "./tschemas.js";
import { Subject } from "rxjs";
const prismaClient = usePrisma();
const model = (model) => (model in prismaClient) ? prismaClient[model] : null;
const getImageMeta = async (buffer) => {
    const metadata = await sharp(buffer).metadata();
    return {
        width: metadata.width,
        height: metadata.height,
        format: metadata.format
    };
};
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
let MediaService = class MediaService {
    previewSize = 512;
    generatePreview = true;
    setGeneratePreview(generate) {
        this.generatePreview = generate;
    }
    getGeneratePreview() {
        return this.generatePreview;
    }
    setPreviewSize(size) {
        this.previewSize = size;
    }
    getPreviewSize() {
        return this.previewSize;
    }
    onDelete$ = new Subject();
    onUpload$ = new Subject();
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
    deleteFunc;
    uploadFunc;
    setDeleteFunc(func) {
        this.deleteFunc = func;
    }
    setUploadFunc(func) {
        this.uploadFunc = func;
    }
    getByUser(userId) {
        return new Promise(async (resolve, reject) => {
            try {
                const db = model('media');
                if (!db) {
                    console.log('Media entity not found in Prisma client. Please check your Prisma schema.');
                    return resolve([]);
                }
                const media = await db.findMany({
                    where: {
                        deletedAt: null,
                        user: {
                            userId: userId
                        },
                        mediaBy: null
                    },
                    include: {
                        media: true
                    }
                });
                resolve(media);
            }
            catch (error) {
                reject(error);
            }
        });
    }
    async getById(id, userId) {
        try {
            const db = model('media');
            if (!db) {
                console.log('Media entity not found in Prisma client. Please check your Prisma schema.');
                return null;
            }
            const media = await db.findUnique({
                where: {
                    id,
                    deletedAt: null
                },
                include: {
                    media: true,
                    user: true
                }
            });
            if (media?.user?.userId !== userId) {
                return null;
            }
            return media;
        }
        catch (error) {
            console.log(error);
            return null;
        }
    }
    async uploadFile(userId, file, isPrivate = false, name) {
        try {
            const db = model('media');
            if (!db) {
                console.log('Media entity not found in Prisma client. Please check your Prisma schema.');
                return null;
            }
            const result = await this.uploadFunc(file, isPrivate);
            if (!result?.url) {
                console.log('Upload function did not return a URL, which is mandatory');
                return null;
            }
            const data = {
                key: result.key || null,
                name: name || file.fieldname || result.key,
                url: result.url,
                s3bucket: result.bucket || null,
                s3region: result.region || null,
                filesize: file.filesize || 0,
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
                if (this.generatePreview) {
                    const thumbnailBuffer = await createThumbnail(buffer, this.previewSize);
                    thumbnail = await this.uploadFunc({
                        buffer: thumbnailBuffer,
                        mimetype: file.mimetype,
                        originalname: file.filename
                    }, isPrivate);
                    thumbnailMeta = await getImageMeta(thumbnailBuffer);
                }
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
                if (this.onUpload$) {
                    this.onUpload$.next({
                        file: file,
                        isPrivate: isPrivate,
                        upload: result
                    });
                }
            }
            catch (error) {
                console.log(error);
            }
            const mediaData = await db.findUnique({
                where: {
                    id: media.id
                },
                include: {
                    media: true
                }
            });
            return mediaData;
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
    async deleteMedia(mediaId) {
        try {
            const db = model('media');
            if (!db) {
                console.log('Media entity not found in Prisma client. Please check your Prisma schema.');
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
                    this.onDelete$.next({
                        mediaId: media.id,
                        isPrivate: media.isPrivate
                    });
                    if (this.deleteFunc) {
                        await this.deleteFunc(media.key, media.isPrivate);
                    }
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
};
MediaService = __decorate([
    Service()
], MediaService);
export default MediaService;
//# sourceMappingURL=media.service.js.map