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
        .get('/by-user/:userId')
        .params(Type.Object({
            userId: Type.String()
        }))
        .description('Get media by userId')
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
            if (!session) {
                return { status: 403, data: { error: 'Session not found' } };
            }
            const userId = req.params.userId;
            if (!userId) {
                return { status: 403, data: { error: 'Session does not have userId' } };
            }
            const mediaService = useMediaProvider();
            const media = await mediaService.getByUser(userId);
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
        .handler(async (req, reply) => {
            const isPrivate = req.params.type === 'private';
            const session = req.session;
            if (!session) {
                return { status: 403, data: { error: 'Session not found' } };
            }
            const user = session.userId || session.id;
            if (!user) {
                return { status: 403, data: { error: 'Session does not have userId' } };
            }
            const files = req.tempFiles;
            const mediaService = useMediaProvider();
            const uploaded = await mediaService.uploadFiles(user, files, isPrivate);
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
        .handler(async (req, reply) => {
            const session = req.session;
            if (!session) {
                return { status: 403, data: { error: 'Session not found' } };
            }
            const id = req.params.id;
            if (!id) {
                return { status: 403, data: { error: 'Media ID is required' } };
            }
            const mediaService = useMediaProvider();
            const user = session.userId || session.id;
            const media = await mediaService.getById(id, user);
            if (!media) {
                return { status: 401, data: { error: 'Media not found' } };
            }
     
            return { status: 200, data: media };
        })
        .build();
}