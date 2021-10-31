import chalk from "chalk";

import { LogLevel } from "../cli/Logger.js";
import { TThemeConfig } from "../config/Config.js";
import ThemeTagger from "../util/ThemeTagger.js";

export const enum ThemeFormatKey {
    // brand
    BRAND = "brand",
    // severity
    DEBUG = "debug",
    NOTICE = "notice",
    INFO = "info",
    WARNING = "warning",
    ERROR = "error",
    FATAL = "fatal",
    // inline
    TRACE = "trace",
    PATH = "path",
    COMMAND = "command",
    BULLET = "bullet",
    // interaction
    QUESTION = "question",
    SELECTION = "selection",
    // task
    TASK = "task",
    SUCCESS = "success",
    FAILURE = "failure"
}

export default class Theme {
    protected readonly severityAssociations = ["debug", "notice", "info", "warning", "error", "fatal"];
    protected readonly severityErrorAssociations = [
        "streamDebug",
        "streamNotice",
        "streamInfo",
        "streamWarning",
        "streamError",
        "streamFatal"
    ];

    public readonly tagger: ThemeTagger;

    public get monochrome(): boolean {
        return this.config === null;
    }

    constructor(protected config: TThemeConfig) {
        this.tagger = new ThemeTagger(this);
    }

    //#region BRAND

    public formatBrand(str: string): string {
        return this.format(ThemeFormatKey.BRAND, str);
    }

    //#endregion

    //#region SEVERITY

    public formatSeverity(level: LogLevel, str: string): string {
        return this.format(this.severityAssociations[level] as keyof TThemeConfig, str);
    }

    public formatSeverityError(level: LogLevel, str: string): string {
        return this.format(this.severityErrorAssociations[level] as keyof TThemeConfig, str);
    }

    public formatDebug(str: string): string {
        return this.format(ThemeFormatKey.DEBUG, str);
    }
    public formatNotice(str: string): string {
        return this.format(ThemeFormatKey.NOTICE, str);
    }
    public formatInfo(str: string): string {
        return this.format(ThemeFormatKey.INFO, str);
    }
    public formatWarning(str: string): string {
        return this.format(ThemeFormatKey.WARNING, str);
    }
    public formatError(str: string): string {
        return this.format(ThemeFormatKey.ERROR, str);
    }
    public formatFatal(str: string): string {
        return this.format(ThemeFormatKey.FATAL, str);
    }

    //#endregion

    //#region INLINE

    public formatTrace(str: string): string {
        return this.format(ThemeFormatKey.TRACE, str);
    }
    public formatPath(str: string): string {
        return this.format(ThemeFormatKey.PATH, str);
    }
    public formatCommand(str: string): string {
        return this.format(ThemeFormatKey.COMMAND, str);
    }
    public formatBullet(str: string): string {
        return this.format(ThemeFormatKey.BULLET, str);
    }

    //#endregion

    //#region INTERACTION

    public formatQuestion(str: string): string {
        return this.format(ThemeFormatKey.QUESTION, str);
    }
    public formatSelection(str: string): string {
        return this.format(ThemeFormatKey.SELECTION, str, true);
    }

    //#endregion

    //#region TASK

    public formatTask(str: string): string {
        return this.format(ThemeFormatKey.TASK, str);
    }

    public formatSuccess(str: string): string {
        return this.format(ThemeFormatKey.SUCCESS, str);
    }

    public formatFailure(str: string): string {
        return this.format(ThemeFormatKey.FAILURE, str);
    }

    //#endregion

    //#region HELPERS

    protected format(key: keyof TThemeConfig, str: string, bgr: boolean = false): string {
        if (!str) {
            return "";
        }
        if (!this.monochrome && this.config[key]) {
            if (bgr) {
                return chalk.bgHex(this.config[key])(str);
            } else {
                return chalk.hex(this.config[key])(str);
            }
        }
        return bgr ? `${str} <<=` : str;
    }

    //#endregion
}
