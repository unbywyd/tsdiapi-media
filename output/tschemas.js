import { Type } from '@sinclair/typebox';
import { DateString } from '@tsdiapi/server';
export const MediaTypeEnum = Type.String({
    enum: ['IMAGE', 'VIDEO', 'DOCUMENT', 'OTHER']
});
export var MediaType;
(function (MediaType) {
    MediaType["IMAGE"] = "IMAGE";
    MediaType["VIDEO"] = "VIDEO";
    MediaType["DOCUMENT"] = "DOCUMENT";
    MediaType["OTHER"] = "OTHER";
})(MediaType || (MediaType = {}));
export const MediaSchema = Type.Object({
    id: Type.String(),
    createdAt: DateString(),
    updatedAt: DateString(),
    deletedAt: Type.Optional(DateString()),
    name: Type.Optional(Type.String()),
    isPrivate: Type.Boolean(),
    format: Type.Optional(Type.String()),
    type: MediaTypeEnum,
    width: Type.Optional(Type.Number()),
    height: Type.Optional(Type.Number()),
    variations: Type.Optional(Type.Array(Type.Object({
        id: Type.String(),
        createdAt: DateString(),
        updatedAt: DateString(),
        deletedAt: Type.Optional(DateString()),
        name: Type.Optional(Type.String()),
        isPrivate: Type.Boolean(),
        format: Type.Optional(Type.String()),
        type: MediaTypeEnum,
        width: Type.Optional(Type.Number()),
        height: Type.Optional(Type.Number()),
        mimetype: Type.Optional(Type.String()),
        filesize: Type.Optional(Type.Number()),
        url: Type.String(),
        key: Type.Optional(Type.String()),
        s3bucket: Type.Optional(Type.String()),
        s3region: Type.Optional(Type.String()),
        parentId: Type.Optional(Type.String()),
    }))),
    mimetype: Type.Optional(Type.String()),
    filesize: Type.Optional(Type.Number()),
    url: Type.String(),
    key: Type.Optional(Type.String()),
    s3bucket: Type.Optional(Type.String()),
    s3region: Type.Optional(Type.String()),
    parentId: Type.Optional(Type.String())
});
export const CreateMediaSchema = Type.Object({
    name: Type.Optional(Type.String()),
    isPrivate: Type.Optional(Type.Boolean()),
    format: Type.Optional(Type.String()),
    type: Type.Optional(MediaTypeEnum),
    width: Type.Optional(Type.Number()),
    height: Type.Optional(Type.Number()),
    mimetype: Type.Optional(Type.String()),
    filesize: Type.Optional(Type.Number()),
    url: Type.String(),
    key: Type.Optional(Type.String()),
    s3bucket: Type.Optional(Type.String()),
    s3region: Type.Optional(Type.String()),
    parentId: Type.Optional(Type.String())
});
export const UpdateMediaSchema = Type.Partial(CreateMediaSchema);
export const GetMediaSchema = Type.Object({
    userId: Type.Optional(Type.String()),
    adminId: Type.Optional(Type.String())
});
//# sourceMappingURL=tschemas.js.map