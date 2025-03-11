import "reflect-metadata";
import type { AppContext, AppPlugin } from "@tsdiapi/server";

export type PluginOptions = {
}
const defaultConfig: PluginOptions = {
}

class App implements AppPlugin {
    name = 'tsdiapi-media';
    config: PluginOptions;
    context: AppContext;
    constructor(config?: PluginOptions) {
        this.config = { ...config };
    }
    async onInit(ctx: AppContext) {
        this.context = ctx;
        console.log('Hello, I am media plugin.');
    }
}

export default function createPlugin(config?: PluginOptions) {
    return new App(config);
}