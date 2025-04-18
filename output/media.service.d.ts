import { MediaOutput, MediaType } from "./tschemas.js";
import { Subject } from "rxjs";
import type { UploadFile } from "@tsdiapi/server";
import type { UploadFileResponse } from "@tsdiapi/s3";
export declare const createThumbnail: (buffer: Buffer, size: number) => Promise<Buffer<ArrayBufferLike>>;
export type OnDeleteEvent = {
    mediaId: string;
    isPrivate: boolean;
};
export type DeleteFunc = (key: string, isPrivate: boolean) => Promise<void> | void;
export type UploadFunc = (file: UploadFile, isPrivate: boolean) => Promise<UploadFileResponse> | UploadFileResponse;
export type OnUploadEvent = {
    file: UploadFile;
    isPrivate: boolean;
    upload: UploadFileResponse | UploadFile;
};
export default class MediaService {
    private previewSize;
    private generatePreview;
    setGeneratePreview(generate: boolean): void;
    getGeneratePreview(): boolean;
    setPreviewSize(size: number): void;
    getPreviewSize(): number;
    onDelete$: Subject<OnDeleteEvent>;
    onUpload$: Subject<OnUploadEvent>;
    getMediaType(mimetype: string): MediaType;
    deleteFunc: DeleteFunc;
    uploadFunc: UploadFunc;
    setDeleteFunc(func: DeleteFunc): void;
    setUploadFunc(func: UploadFunc): void;
    getByUser(userId: string | number): Promise<MediaOutput[]>;
    getById(id: string, userId: string): Promise<MediaOutput | null>;
    uploadFile(userId: string | number, file: UploadFile, isPrivate?: boolean, name?: string): Promise<MediaOutput | null>;
    uploadFiles(userId: string | number, files: UploadFile[], isPrivate?: boolean): Promise<MediaOutput[]>;
    deleteMedia(mediaId: string): Promise<boolean>;
}
//# sourceMappingURL=media.service.d.ts.map