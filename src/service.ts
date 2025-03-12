import { Service } from "typedi";
import { client } from "@tsdiapi/prisma";
import { toDTO } from "@tsdiapi/server";
import { IsEnum, IsNumber, IsOptional, IsString } from "class-validator";
import { Expose } from "class-transformer";
import sharp from "sharp";

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

const model = (model: string) => (model in (client as any)) ? (client as any)[model] : null;
export type DeleteFunc = (key: string, isPrivate: boolean) => Promise<void> | void;
export type UploadFunc = (file: Express.Multer.File, isPrivate: boolean) => Promise<UploadFile> | UploadFile;
export type OnUpload = (file: Express.Multer.File, isPrivate: boolean, upload: UploadFile) => Promise<void> | void;
export enum MediaType {
    IMAGE = "IMAGE",
    VIDEO = "VIDEO",
    DOCUMENT = "DOCUMENT",
    OTHER = "OTHER"
}

export type UploadFile = {
    key?: string;
    url: string;
    bucket?: string;
    region?: string;
    name?: string;
}

const getImageMeta = async (buffer: Buffer): Promise<{ width: number, height: number, format: string }> => {
    const metadata = await sharp(buffer).metadata();
    return {
        width: metadata.width,
        height: metadata.height,
        format: metadata.format
    };
}

export class OutputMediaDTO {
    @IsString()
    @Expose()
    id: string;

    @IsOptional()
    @IsNumber()
    width?: number;

    @IsOptional()
    @IsNumber()
    height?: number;

    @IsEnum(MediaType)
    @Expose()
    type: MediaType;

    @IsString()
    @Expose()
    @IsOptional()
    name: string;

    @IsNumber()
    @Expose()
    filesize: number;

    @IsString()
    @Expose()
    s3bucket: string;

    @IsString()
    @Expose()
    s3region: string;

    @IsString()
    @Expose()
    @IsOptional()
    mimetype: string;

    @IsString()
    @Expose()
    url: string;

    @IsString()
    @Expose()
    @IsOptional()
    key: string;
}
@Service()
export class MediaService {
    deleteFunc: DeleteFunc;
    uploadFunc: UploadFunc;
    onUpload: OnUpload;
    previewSize: number = 512;
    constructor() { }
    public setOnUploadFunc(func: OnUpload) {
        this.onUpload = func;
    }
    public setDeleteFunc(func: DeleteFunc) {
        this.deleteFunc = func;
    }
    public setUploadFunc(func: (file: Express.Multer.File, isPrivate: boolean) => Promise<UploadFile>) {
        this.uploadFunc = func;
    }
    public setPreviewSize(size: number) {
        this.previewSize = size;
    }
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
                    await this.deleteFunc(media?.key, media?.isPrivate);
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

    async uploadFile(userId: string | number, file: Express.Multer.File, isPrivate = false, name?: string): Promise<OutputMediaDTO | null> {
        try {
            const db = model('media');
            if (!db) {
                console.log('Media entity not found in Prisma client. Please check your Prisma schema.');
                return null;
            }
            const result = await this.uploadFunc(file, isPrivate);
            if (!result?.url) {
                console.log('Upload function did not return a URL, which is mandatory')
                return null;
            }
            const data: Record<string, any> = {
                key: result.key || null,
                name: name || result.name || file.originalname,
                url: result.url,
                s3bucket: result.bucket || null,
                s3region: result.region || null,
                filesize: file.size || 0,
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
                const thumbnailBuffer = await createThumbnail(buffer, this.previewSize);
                thumbnail = await this.uploadFunc({
                    buffer: thumbnailBuffer,
                    mimetype: file.mimetype,
                    originalname: file.originalname
                } as any, isPrivate) as UploadFile;
                thumbnailMeta = await getImageMeta(thumbnailBuffer);
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
                if (this.onUpload) {
                    this.onUpload(file, isPrivate, result);
                }
            } catch (error) {
                console.log(error);
            }

            return toDTO<any>(OutputMediaDTO, media);
        } catch (error) {
            console.log(error);
            return null;
        }
    }

    async uploadFiles(userId: string | number, files: Express.Multer.File[], isPrivate = false): Promise<OutputMediaDTO[]> {
        try {
            const results: OutputMediaDTO[] = [];
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
}