import type { AppContext, AppPlugin } from "@tsdiapi/server";
import { DeleteFunc, MediaService, OnUpload } from "./service.js";
export * from "./service.js";
export type PluginOptions = {
    onDelete?: DeleteFunc;
    onUpload?: OnUpload;
    previewSize?: number;
};
declare class App implements AppPlugin {
    name: string;
    config: PluginOptions;
    context: AppContext;
    constructor(config?: PluginOptions);
    onInit(ctx: AppContext): Promise<void>;
}
export declare function getMediaProvider(): MediaService;
export default function createPlugin(config?: PluginOptions): App;
//# sourceMappingURL=index.d.ts.map