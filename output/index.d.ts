import type { AppContext, AppPlugin } from "@tsdiapi/server";
import MediaService from "./media.service.js";
export * from "./media.service.js";
export type PluginOptions = {
    previewSize?: number;
    autoRegisterControllers?: boolean;
    generatePreview?: boolean;
};
declare class App implements AppPlugin {
    name: string;
    config: PluginOptions;
    context: AppContext;
    constructor(config?: PluginOptions);
    onInit(ctx: AppContext): Promise<void>;
    preReady(): Promise<void>;
}
export declare function useMediaProvider(): MediaService;
export default function createPlugin(config?: PluginOptions): App;
//# sourceMappingURL=index.d.ts.map