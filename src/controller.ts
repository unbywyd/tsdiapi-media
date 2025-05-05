import { AppContext } from "@tsdiapi/server";
import { Type } from "@sinclair/typebox";
import { isBearerValid } from "@tsdiapi/jwt-auth";
import { MediaSchema } from "./tschemas.js";
import { useMediaProvider } from "./index.js";

const BodySchema = Type.Object({
    files: Type.Array(Type.String({
        format: 'binary'
    }))
});

export default async function registerMetaRoutes({ useRoute }: AppContext) {
    useRoute()
        .controller('media')
        .get('/me')
        .description('Get media')
        .code(403, Type.Object({
            error: Type.String()
        }))
        .code(404, Type.Object({
            error: Type.String()
        }))
        .auth('bearer', async (req, reply) => {
            const isValid = await isBearerValid(req);
            if (!isValid) {
                return {
                    status: 403,
                    data: {
                        error: 'Invalid access token'
                    }
                }
            }
            return true;
        })
        .code(200, Type.Array(MediaSchema))
        .handler(async (req, reply) => {
            const session = req.session;
            const query = {
                ...((session?.id && !session.adminId) ? { userId: session.id } : {}),
                ...(session?.adminId ? { adminId: session.adminId } : {})
            }
            const mediaService = useMediaProvider();
            const media = await mediaService.getBy(query);
            return { status: 200, data: media };
        })
        .build();

    useRoute()
        .controller('media')
        .body(BodySchema)
        .description('Media upload')
        .code(403, Type.Object({
            error: Type.String()
        }))
        .auth('bearer', async (req, reply) => {
            const isValid = await isBearerValid(req);
            if (!isValid) {
                return {
                    status: 403,
                    data: {
                        error: 'Invalid access token'
                    }
                }
            }
            return true;
        })
        .post('/upload/:type')
        .params(Type.Object({
            type: Type.String({
                enum: ['private', 'public']
            })
        }))
        .acceptMultipart()
        .code(200, Type.Array(MediaSchema))
        .fileOptions({
            maxFileSize: 50 * 1024 * 1024, // максимальный размер файла (50MB)
            maxFiles: 10 // максимальное количество файлов
        })
        .setRequestFormat('multipart/form-data')
        .handler(async (req) => {
            const isPrivate = req.params.type === 'private';
            const session = req.session;
            const query = {
                ...((session?.id && !session.adminId) ? { userId: session.id } : {}),
                ...(session?.adminId ? { adminId: session.adminId } : {})
            }
            const files = req.tempFiles;
            const mediaService = useMediaProvider();
            const uploaded = await mediaService.uploadFiles(query, files, isPrivate);
            return { status: 200, data: uploaded };
        })
        .build();

    useRoute()
        .controller('media')
        .get('/single/:id')
        .params(Type.Object({
            id: Type.String()
        }))
        .description('Get media by ID')
        .code(403, Type.Object({
            error: Type.String()
        }))
        .code(401, Type.Object({
            error: Type.String()
        }))
        .auth('bearer', async (req, reply) => {
            const isValid = await isBearerValid(req);
            if (!isValid) {
                return {
                    status: 403,
                    data: {
                        error: 'Invalid access token'
                    }
                }
            }
            return true;
        })
        .code(200, MediaSchema)
        .handler(async (req) => {
            const session = req.session;
            const query = {
                ...((session?.id && !session.adminId) ? { userId: session.id } : {}),
                ...(session?.adminId ? { adminId: session.adminId } : {})
            }
            const mediaService = useMediaProvider();
            const media = await mediaService.getById(req.params.id, query);
            if (!media) {
                return { status: 401, data: { error: 'Media not found' } };
            }

            return { status: 200, data: media };
        })
        .build();
}