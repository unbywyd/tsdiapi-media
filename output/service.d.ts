export declare const createThumbnail: (buffer: Buffer, size: number) => Promise<{
    largeBuffer: Buffer;
    thumbnailBuffer: Buffer;
}>;
export type DeleteFunc = (key: string, isPrivate: boolean) => Promise<void> | void;
export type UploadFunc = (file: Express.Multer.File, isPrivate: boolean) => Promise<UploadFile> | UploadFile;
export type OnUpload = (file: Express.Multer.File, isPrivate: boolean, upload: UploadFile) => Promise<void> | void;
export declare enum MediaType {
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
};
export declare class OutputMediaDTO {
    id: string;
    width?: number;
    height?: number;
    type: MediaType;
    name: string;
    filesize: number;
    s3bucket: string;
    s3region: string;
    mimetype: string;
    url: string;
    key: string;
}
export declare class MediaService {
    deleteFunc: DeleteFunc;
    uploadFunc: UploadFunc;
    onUpload: OnUpload;
    previewSize: number;
    constructor();
    setOnUploadFunc(func: OnUpload): void;
    setDeleteFunc(func: DeleteFunc): void;
    setUploadFunc(func: (file: Express.Multer.File, isPrivate: boolean) => Promise<UploadFile>): void;
    setPreviewSize(size: number): void;
    getMediaType(mimetype: string): MediaType;
    deleteMedia(mediaId: string): Promise<boolean>;
    uploadFile(userId: string | number, file: Express.Multer.File, isPrivate?: boolean, name?: string): Promise<OutputMediaDTO | null>;
    uploadFiles(userId: string | number, files: Express.Multer.File[], isPrivate?: boolean): Promise<OutputMediaDTO[]>;
}
//# sourceMappingURL=service.d.ts.map