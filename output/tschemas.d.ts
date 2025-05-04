import { Static } from '@sinclair/typebox';
export declare const MediaTypeEnum: import("@sinclair/typebox").TString;
export declare enum MediaType {
    IMAGE = "IMAGE",
    VIDEO = "VIDEO",
    DOCUMENT = "DOCUMENT",
    OTHER = "OTHER"
}
export declare const MediaSchema: import("@sinclair/typebox").TObject<{
    id: import("@sinclair/typebox").TString;
    createdAt: import("@sinclair/typebox").TDate;
    updatedAt: import("@sinclair/typebox").TDate;
    deletedAt: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TDate>;
    name: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TString>;
    isPrivate: import("@sinclair/typebox").TBoolean;
    format: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TString>;
    type: import("@sinclair/typebox").TString;
    width: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TNumber>;
    height: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TNumber>;
    variations: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TArray<import("@sinclair/typebox").TObject<{
        id: import("@sinclair/typebox").TString;
        createdAt: import("@sinclair/typebox").TDate;
        updatedAt: import("@sinclair/typebox").TDate;
        deletedAt: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TDate>;
        name: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TString>;
        isPrivate: import("@sinclair/typebox").TBoolean;
        format: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TString>;
        type: import("@sinclair/typebox").TString;
        width: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TNumber>;
        height: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TNumber>;
        mimetype: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TString>;
        filesize: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TNumber>;
        url: import("@sinclair/typebox").TString;
        key: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TString>;
        s3bucket: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TString>;
        s3region: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TString>;
        parentId: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TString>;
    }>>>;
    mimetype: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TString>;
    filesize: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TNumber>;
    url: import("@sinclair/typebox").TString;
    key: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TString>;
    s3bucket: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TString>;
    s3region: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TString>;
    parentId: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TString>;
}>;
export type MediaOutput = Static<typeof MediaSchema>;
export declare const CreateMediaSchema: import("@sinclair/typebox").TObject<{
    name: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TString>;
    isPrivate: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TBoolean>;
    format: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TString>;
    type: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TString>;
    width: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TNumber>;
    height: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TNumber>;
    mimetype: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TString>;
    filesize: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TNumber>;
    url: import("@sinclair/typebox").TString;
    key: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TString>;
    s3bucket: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TString>;
    s3region: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TString>;
    parentId: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TString>;
}>;
export declare const UpdateMediaSchema: import("@sinclair/typebox").TObject<{
    name: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TString>;
    isPrivate: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TBoolean>;
    format: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TString>;
    type: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TString>;
    width: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TNumber>;
    height: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TNumber>;
    mimetype: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TString>;
    filesize: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TNumber>;
    url: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TString>;
    key: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TString>;
    s3bucket: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TString>;
    s3region: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TString>;
    parentId: import("@sinclair/typebox").TOptional<import("@sinclair/typebox").TString>;
}>;
//# sourceMappingURL=tschemas.d.ts.map