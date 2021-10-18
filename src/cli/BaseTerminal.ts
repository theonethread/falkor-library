import readline from "readline";
import stripAnsi from "strip-ansi";
import shell from "shelljs";
import ansiEscapes from "ansi-escapes";

import TerminalAnimation from "./TerminalAnimation.js";
import { TTerminalConfig } from "../config/Config.js";
import Logger, { LogLevel } from "./Logger.js";
import Theme from "../util/Theme.js";

export default class BaseTerminal {
    protected readonly ansi: boolean;
    protected readonly streamPrefix = "| ";
    protected readonly storedWrite = process.stdout.write;
    protected readonly streamResizeListener = () => this.internalStreamResizeListener();
    protected interface = readline.createInterface({
        input: process.stdin,
        output: process.stdout,
        historySize: 0,
        tabSize: 2
    });
    protected cursorShown: boolean = true;
    protected muted: boolean = false;
    protected streaming: boolean = false;
    protected streamLevel: number = null;
    protected streamPad: number = null;
    protected streamBuffer: string = null;
    protected lineBuffer: string = null;
    protected terminalAnimation: TerminalAnimation = null;

    constructor(config: TTerminalConfig, protected logger: Logger, protected theme: Theme) {
        this.ansi = process.stdout.isTTY && config.ansi;
        if (this.ansi && config.animation) {
            const ansiLog = (str: string) => this.logger.logAnsi(str);
            if (typeof config.animation === "boolean") {
                // true
                this.terminalAnimation = new TerminalAnimation(theme, ansiLog);
            } else {
                // string[]
                this.terminalAnimation = new TerminalAnimation(theme, ansiLog, config.animation);
            }
        }
        process.on("exit", () => this.close());
    }

    //#region CURSOR

    public hideCursor(): void {
        if (this.ansi && this.cursorShown) {
            this.logger.logAnsi(ansiEscapes.cursorHide);
            this.cursorShown = false;
        }
    }

    public showCursor(): void {
        if (this.ansi && !this.cursorShown) {
            this.logger.logAnsi(ansiEscapes.cursorShow);
            this.cursorShown = true;
        }
    }

    //#endregion

    //#region MUTE

    public mute(): void {
        if (!this.muted) {
            process.stdout.write = (): boolean => true;
            this.muted = true;
        }
    }

    public unmute(): void {
        if (this.muted) {
            process.stdout.write = this.storedWrite;
            this.muted = false;
        }
    }

    //#endregion

    //#region STREAM

    public startStream(level: LogLevel): (chunk: string, isError?: boolean) => void {
        this.streaming = true;
        this.streamLevel = level;
        this.streamBuffer = "";
        const prefix = this.logger.log(level, [this.streamPrefix], true);
        this.streamPad = prefix === null ? null : stripAnsi(prefix).length;
        this.logger.startStream();
        if (!this.ansi) {
            return (chunk: string, isError?: boolean) => {
                this.streamBuffer += isError ? this.theme.formatSeverityError(level, chunk) : chunk;
            };
        } else if (this.streamPad === null) {
            this.terminalAnimation?.start();
            return (chunk: string, isError?: boolean) => {
                this.streamBuffer += isError ? this.theme.formatSeverityError(level, chunk) : chunk;
            };
        } else {
            this.logger.logAnsi(prefix);
            this.lineBuffer = "";
            process.stdout.on("resize", this.streamResizeListener);
            if (this.terminalAnimation) {
                this.terminalAnimation.start();
                return (chunk: string, isError?: boolean) => {
                    const formatted = isError ? this.theme.formatSeverityError(level, chunk) : chunk;
                    this.streamBuffer += formatted;
                    this.terminalAnimation.clearFrame();
                    const streamed = this.theme.formatSeverity(
                        level,
                        this.logger.padNewLines(formatted, this.streamPad, this.streamPrefix)
                    );
                    this.logger.logAnsi(streamed);
                    this.terminalAnimation.printFrame();
                    this.lineBuffer = streamed.slice(streamed.lastIndexOf("\n") + 1);
                };
            } else {
                return (chunk: string, isError?: boolean) => {
                    const formatted = isError ? this.theme.formatSeverityError(level, chunk) : chunk;
                    this.streamBuffer += formatted;
                    const streamed = this.theme.formatSeverity(
                        level,
                        this.logger.padNewLines(formatted, this.streamPad, this.streamPrefix)
                    );
                    this.logger.logAnsi(streamed);
                    this.lineBuffer = streamed.slice(streamed.lastIndexOf("\n") + 1);
                };
            }
        }
    }

    public endStream(): string {
        this.terminalAnimation?.stop();
        this.logger.endStream();
        if (this.streamPad !== null) {
            if (this.ansi) {
                shell.echo();
                process.stdout.removeListener("resize", this.streamResizeListener);
            } else {
                this.logger.log(this.streamLevel, [
                    this.logger.padNewLines(
                        this.streamPrefix + this.streamBuffer,
                        this.streamPrefix.length,
                        this.streamPrefix
                    )
                ]);
            }
        }

        const ret = this.streamBuffer;
        this.streamLevel = null;
        this.streamBuffer = null;
        this.lineBuffer = null;
        this.streamPad = null;
        this.streaming = false;
        return ret;
    }

    protected internalStreamResizeListener(): void {
        if (this.lineBuffer) {
            if (this.terminalAnimation) {
                this.terminalAnimation.clearFrame();
                this.logger.logAnsi(ansiEscapes.eraseLine + ansiEscapes.cursorTo(0) + this.lineBuffer);
                this.terminalAnimation.printFrame();
            } else {
                this.logger.logAnsi(ansiEscapes.eraseLine + ansiEscapes.cursorTo(0) + this.lineBuffer);
            }
        }
    }

    //#endregion

    //#region HELPERS

    protected close(): void {
        if (this.interface) {
            this.interface.close();
            this.interface = null;
        }
        if (!this.cursorShown) {
            this.showCursor();
        }
    }

    //#endregion
}
