import "reflect-metadata";
import type { AppContext, AppPlugin } from "@tsdiapi/server";
import { DeleteFunc, OnUpload } from "./service.js";
export type PluginOptions = {
    onDelete?: DeleteFunc;
    onUpload?: OnUpload;
    previewSize?: string;
};
declare class App implements AppPlugin {
    name: string;
    config: PluginOptions;
    context: AppContext;
    constructor(config?: PluginOptions);
    onInit(ctx: AppContext): Promise<void>;
}
export default function createPlugin(config?: PluginOptions): App;
export {};
//# sourceMappingURL=index.d.ts.map