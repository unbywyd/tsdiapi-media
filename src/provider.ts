import type { Logger } from "winston";
import { PluginOptions } from "./index";

export class MediaProvider {
    private config: PluginOptions;
    private logger: Logger;

    constructor(config: PluginOptions, logger: Logger) {
        this.config = config;
        this.logger = logger;
    }

    public init() {
        this.logger.info(`Initializing Media provider...`);
        // TODO: Your initialization logic here
    }
}