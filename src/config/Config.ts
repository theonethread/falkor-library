import path from "path";
import shell from "shelljs";
import figlet from "figlet";

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
    "debug-error": string;
    "notice-error": string;
    "info-error": string;
    "warning-error": string;
    "error-error": string;
    "fatal-error": string;
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
            "debug-error": "#07a",
            "notice-error": "#888",
            "info-error": "#999",
            "warning-error": "#a00",
            "error-error": "#f77",
            "fatal-error": "#f00",
            // interaction
            question: "#fb0",
            selection: "#045",
            // task
            task: "#59f",
            success: "#182",
            failure: "#715"
        }
    };
    protected opsFile = ".ops.json";
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
        if (shell.test("-f", this.opsFile)) {
            this.externalConfig = JSON.parse(shell.cat(this.opsFile));
            this.assign(this.config, this.externalConfig);
        } else {
            this.opsFile = null;
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
            this.themeFile = path.posix.join(process.cwd(), source.theme);
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
