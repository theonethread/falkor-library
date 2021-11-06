import shell from "shelljs";
import figlet from "figlet";
import stripJsonComments from "strip-json-comments";

import falkorUtil from "../util/Util.js";
import { LogLevel } from "../cli/Logger.js";

export type TTerminalConfig = {
    animation?: boolean | string[];
    ansi?: boolean;
};

export type TLoggerConfig = {
    level?: LogLevel;
    timestamp?: boolean;
};

export type TBrandConfig = {
    fancy?: boolean;
    font?: figlet.Fonts;
    quote?: boolean;
};

export type TThemeConfig = {
    brand?: string;
    debug?: string;
    notice?: string;
    info?: string;
    warning?: string;
    error?: string;
    fatal?: string;
    streamDebug?: string;
    streamNotice?: string;
    streamInfo?: string;
    streamWarning?: string;
    streamError?: string;
    streamFatal?: string;
    trace?: string;
    path?: string;
    command?: string;
    bullet?: string;
    question?: string;
    selection?: string;
    task?: string;
    success?: string;
    failure?: string;
};

export type TConfig = {
    terminal?: TTerminalConfig;
    logger?: TLoggerConfig;
    theme?: TThemeConfig;
    brand?: TBrandConfig;
};

export default class Config {
    protected readonly opsFileNames = [".falkorrc", ".ops.json", ".ops.jsonc", "falkor.json", "falkor.jsonc"];
    protected readonly config: TConfig = {
        terminal: {
            ansi: true,
            animation: true
        },
        logger: {
            level: LogLevel.INFO,
            timestamp: true
        },
        brand: {
            fancy: true,
            font: "Graffiti",
            quote: false
        },
        theme: {
            // brand
            brand: "#98f",
            // severity
            debug: "#0aa",
            notice: "#888",
            info: "#999",
            warning: "#a00",
            error: "#f77",
            fatal: "#f00",
            // inline
            trace: "#555",
            path: "#54d",
            command: "#a0a",
            bullet: "#a83",
            // stream
            streamDebug: "#07a",
            streamNotice: "#888",
            streamInfo: "#999",
            streamWarning: "#a00",
            streamError: "#f77",
            streamFatal: "#f00",
            // interaction
            question: "#fb0",
            selection: "#045",
            // task
            task: "#59f",
            success: "#182",
            failure: "#715"
        }
    };
    protected opsFile: string;
    protected themeFile: string = null;
    protected externalConfig: any;

    public get terminal(): TTerminalConfig {
        return this.config.terminal;
    }

    public get logger(): TLoggerConfig {
        return this.config.logger;
    }

    public get brand(): TBrandConfig {
        return this.config.brand;
    }

    public get theme(): TThemeConfig {
        return this.config.theme;
    }

    public get external(): any {
        return this.externalConfig;
    }

    constructor() {
        this.opsFile = this.opsFileNames.find((f) => shell.test("-f", f)) || null;
        if (this.opsFile) {
            try {
                this.externalConfig = JSON.parse(stripJsonComments(shell.cat(this.opsFile).toString()));
                this.assign(this.config, this.externalConfig);
            } catch (e) {
                console.error(`External config error, check your ops-file (${this.opsFile})`);
                this.opsFile = null;
            }
        }

        falkorUtil.deepFreeze(this.config);
        if (this.externalConfig && Object.getOwnPropertyNames(this.externalConfig).length) {
            falkorUtil.deepFreeze(this.externalConfig);
        } else {
            this.externalConfig = null;
        }
    }

    protected assign(target: TConfig, source: TConfig): void {
        if (source.terminal) {
            Object.assign(target.terminal, source.terminal);
            delete source.terminal;
        }
        if (source.logger) {
            Object.assign(target.logger, source.logger);
            delete source.logger;
        }
        if (source.brand) {
            Object.assign(target.brand, source.brand);
            delete source.brand;
        }
        if (source.theme === null) {
            target.theme = null;
            delete source.theme;
        } else {
            this.assignTheme(target, source);
        }
    }

    protected assignTheme(target: TConfig, source: TConfig): void {
        if (typeof source.theme === "string") {
            this.themeFile = source.theme;
            const externalTheme = JSON.parse(shell.cat(source.theme));
            if (externalTheme === null) {
                target.theme = null;
            } else if (externalTheme) {
                Object.assign(target.theme, externalTheme);
            }
        } else if (source.theme) {
            Object.assign(target.theme, source.theme);
        }
        delete source.theme;
    }
}
