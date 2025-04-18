import { Type } from '@sinclair/typebox';
import { Static } from '@sinclair/typebox';
import { DateString } from '@tsdiapi/server';

export const MediaTypeEnum = Type.String({
    enum: ['IMAGE', 'VIDEO', 'DOCUMENT', 'OTHER']
});
export enum MediaType {
  IMAGE = "IMAGE",
  VIDEO = "VIDEO",
  DOCUMENT = "DOCUMENT",
  OTHER = "OTHER"
}
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
  media: Type.Optional(Type.Array(Type.Object({
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
    mediaId: Type.Optional(Type.String()),
  }))),
  mimetype: Type.Optional(Type.String()),
  filesize: Type.Optional(Type.Number()),
  url: Type.String(),
  key: Type.Optional(Type.String()),
  s3bucket: Type.Optional(Type.String()),
  s3region: Type.Optional(Type.String()),
  mediaId: Type.Optional(Type.String())
});

export type MediaOutput = Static<typeof MediaSchema>;

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
  mediaId: Type.Optional(Type.String())
});

export const UpdateMediaSchema = Type.Partial(CreateMediaSchema);
