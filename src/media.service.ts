import { Service } from "typedi";
import sharp from "sharp";
import { usePrisma } from "@tsdiapi/prisma";
import { MediaOutput, MediaType } from "./tschemas.js";
import { Subject } from "rxjs";
import type { UploadFile } from "@tsdiapi/server";
import type { UploadFileResponse } from "@tsdiapi/s3";

const model = (model: string) => {
    const prismaClient = usePrisma();
    return (model in (prismaClient as any)) ? (prismaClient as any)[model] : null;
}
const getImageMeta = async (buffer: Buffer): Promise<{ width: number, height: number, format: string }> => {
    const metadata = await sharp(buffer).metadata();
    return {
        width: metadata.width,
        height: metadata.height,
        format: metadata.format
    };
}
export const createThumbnail = async (buffer: Buffer, size: number) => {
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
}
export type OnDeleteEvent = {
    mediaId: string;
    isPrivate: boolean;
}
export type DeleteFunc = (key: string, isPrivate: boolean) => Promise<void> | void;
export type UploadFunc = (file: UploadFile, isPrivate: boolean) => Promise<UploadFileResponse> | UploadFileResponse;

export type OnUploadEvent = {
    file: UploadFile;
    isPrivate: boolean;
    upload: UploadFileResponse | UploadFile;
}

@Service()
export default class MediaService {
    private previewSize: number = 512;
    private generatePreview: boolean = true;
    public setGeneratePreview(generate: boolean) {
        this.generatePreview = generate;
    }
    public getGeneratePreview(): boolean {
        return this.generatePreview;
    }
    public setPreviewSize(size: number) {
        this.previewSize = size;
    }
    public getPreviewSize(): number {
        return this.previewSize;
    }
    onDelete$: Subject<OnDeleteEvent> = new Subject<OnDeleteEvent>();
    onUpload$: Subject<OnUploadEvent> = new Subject<OnUploadEvent>();
    getMediaType(mimetype: string): MediaType {
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
    deleteFunc: DeleteFunc;
    uploadFunc: UploadFunc;
    public setDeleteFunc(func: DeleteFunc) {
        this.deleteFunc = func;
    }
    public setUploadFunc(func: UploadFunc) {
        this.uploadFunc = func;
    }
    public getByUser(userId: string | number): Promise<MediaOutput[]> {
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
                            userId: userId as any
                        },
                        mediaBy: null
                    },
                    include: {
                        media: true
                    }
                });
                resolve(media as MediaOutput[]);
            } catch (error) {
                reject(error);
            }
        });
    }

    public async getById(id: string, userId: string): Promise<MediaOutput | null> {
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
            return media as MediaOutput;
        } catch (error) {
            console.log(error);
            return null;
        }
    }

    async uploadFile(userId: string | number, file: UploadFile, isPrivate = false, name?: string): Promise<MediaOutput | null> {
        try {
            const db = model('media');
            if (!db) {
                console.log('Media entity not found in Prisma client. Please check your Prisma schema.');
                return null;
            }
            const result = file?.url ? {
                ...file,
                key: file.id,
                region: file.s3region,
                bucket: file.s3bucket,
                type: this.getMediaType(file.mimetype),
                name: name || file.fieldname || file.id,
            } : await this.uploadFunc(file, isPrivate);
            if (!result?.url) {
                console.log('Upload function did not return a URL, which is mandatory')
                return null;
            }
            const data: Record<string, any> = {
                key: result.key || null,
                name: name || file.fieldname || result.key,
                url: result.url,
                s3bucket: result.bucket || null,
                s3region: result.region || null,
                filesize: file.filesize || 0,
                mimetype: file.mimetype || null,
                type: this.getMediaType(file.mimetype)
            }

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
                    } as any, isPrivate) as unknown as UploadFile;
                    thumbnailMeta = await getImageMeta(thumbnailBuffer);
                }
            } else {
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
                }
            }
            const media = await db.create({
                data: {
                    ...data as any,
                    ...(thumbnail ? {
                        media: {
                            create: thumbnail
                        }
                    } : {}),
                    user: {
                        create: {
                            userId: userId as any
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
            } catch (error) {
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
            return mediaData as MediaOutput;
        } catch (error) {
            console.log(error);
            return null;
        }
    }
    async uploadFiles(userId: string | number, files: UploadFile[], isPrivate = false): Promise<MediaOutput[]> {
        try {
            const results: MediaOutput[] = [];
            for (const file of files) {
                const result = await this.uploadFile(userId, file, isPrivate);
                if (result) {
                    results.push(result);
                }
            }
            return results;
        } catch (error) {
            console.log(error);
            return null;
        }
    }
    async deleteMedia(mediaId: string): Promise<boolean> {
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
            } catch (error) {
                console.log(error);
            }

            if (media.media?.length) {
                for (const m of media.media) {
                    try {
                        if (m.key) {
                            await this.deleteMedia(m?.id);
                        }
                    } catch (error) {
                        console.log(error);
                    }
                }
            }
            return true;
        } catch (error) {
            return false;
        }
    }
}