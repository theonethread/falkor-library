import shell from "shelljs";
import stripAnsi from "strip-ansi";

import { TLoggerConfig } from "../config/Config.js";
import FalkorError from "../error/FalkorError.js";
import Theme from "../util/Theme.js";

export const enum LoggerErrorCodes {
    LOG_MIDSTREAM = "logger-log-midstream",
    INVALID_STREAM = "logger-invalid-stream"
}

export const enum LogLevel {
    DEBUG,
    NOTICE,
    INFO,
    WARNING,
    ERROR,
    FATAL
}

export default class Logger {
    protected readonly txtSeverity = ["DBG", "NTC", "INF", "WRN", "ERR", "FAT"];
    protected readonly promptJoiner = " ";
    protected readonly joiner = " ";
    protected readonly newLineRe = /(\r?\n)+/g;

    protected level: LogLevel;
    protected timestamp: boolean;
    protected prompt: string[] = [];
    protected inStream: boolean = false;

    constructor(config: TLoggerConfig, protected theme: Theme) {
        this.level = config.level;
        this.timestamp = config.timestamp;
    }

    //#region PROMPT

    public pushPrompt(str: string = "   "): Logger {
        this.prompt.push(str);
        return this;
    }

    public popPrompt(num: number = 1): Logger {
        while (num > 0 && this.prompt.length) {
            this.prompt.pop();
            num--;
        }
        return this;
    }

    public clearCurrentPrompt(): Logger {
        this.prompt.push("".padEnd(stripAnsi(this.prompt.pop()).length));
        return this;
    }

    public emptyPrompt(keep: number = 0): Logger {
        this.prompt.length = keep;
        return this;
    }

    //#endregion

    //#region LEVEL

    public debug(...message: any[]): Logger {
        this.log(LogLevel.DEBUG, message);
        return this;
    }

    public notice(...message: any[]): Logger {
        this.log(LogLevel.NOTICE, message);
        return this;
    }

    public info(...message: any[]): Logger {
        this.log(LogLevel.INFO, message);
        return this;
    }

    public warning(...message: any[]): Logger {
        this.log(LogLevel.WARNING, message);
        return this;
    }

    public error(...message: any[]): Logger {
        this.log(LogLevel.ERROR, message);
        return this;
    }

    public fatal(...message: any[]): Logger {
        this.log(LogLevel.FATAL, message);
        return this;
    }

    //#endregion

    //#region STREAMING

    public startStream(): void {
        this.inStream = true;
    }

    public endStream(): void {
        this.inStream = false;
    }

    public logAnsi(streamTxt: string): void {
        shell.echo("-n", streamTxt);
    }

    //#endregion

    //#region HELPERS

    /** @throws FalkorError: LoggerErrorCodes.LOG_MIDSTREAM */
    public log(level: LogLevel, message: any[], streaming: boolean = false): string {
        if (!streaming && this.inStream) {
            throw new FalkorError(LoggerErrorCodes.LOG_MIDSTREAM, "Logger: tried to log midstream");
        }
        if (level < this.level) {
            return null;
        }
        let pad = 0;
        const prompt = this.prompt.join(this.promptJoiner);
        if (prompt.length) {
            pad += stripAnsi(prompt).length + this.joiner.length;
            message.unshift(prompt);
        }
        const logStarter = this.timestamp ? new Date().toISOString() + this.joiner : "";
        pad += logStarter.length;
        let log: string;
        if (this.theme.monochrome) {
            pad += this.txtSeverity[level].length + this.joiner.length;
            message.unshift(logStarter + this.txtSeverity[level]);
            log = this.padNewLines(message.join(this.joiner), pad);
        } else {
            log = this.theme.formatSeverity(
                level,
                this.padNewLines(this.theme.formatTrace(logStarter) + message.join(this.joiner), pad)
            );
        }
        if (!streaming) {
            shell.echo(log);
        }
        return log;
    }

    public padNewLines(str: string, pad: number, prefix: string = ""): string {
        return str.replace(this.newLineRe, "\n" + " ".repeat(pad - prefix.length) + prefix);
    }

    //#endregion
}
