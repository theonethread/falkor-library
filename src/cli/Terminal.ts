import { Key } from "readline";
import shell from "shelljs";
import ansiEscapes from "ansi-escapes";

import BaseTerminal from "./BaseTerminal.js";
import { TTerminalConfig } from "../config/Config.js";
import Logger from "./Logger.js";
import Theme from "../util/Theme.js";
import Ascii, { ListType } from "../util/Ascii.js";

const enum InteractiveMoveDirection {
    PREVIOUS,
    NEXT
}

export type AskOptions = {
    password?: boolean;
    answers?: string[];
    descriptions?: string[];
    list?: boolean;
    multi?: boolean;
};

export default class Terminal extends BaseTerminal {
    protected readonly maxFailure = 5;
    protected readonly numberRe = /^\d+$/;
    protected readonly multipleNumberRe = /^\d+(\s*,\s*\d+)*$/;
    protected readonly multipleSplitRe = /\s*,\s*/;
    protected readonly listKeypressListener: (_: string, key: Key) => void;
    protected readonly listResizeListener: () => void;
    protected readonly questionPrompt: string;
    protected readonly passwordPrompt: string;
    protected answerCount: number;
    protected selectionType: ListType;
    protected selection: number = null;
    protected multiSelection: number[] = null;
    protected selectionList: string[];
    protected nonMultiSelectionList: string[];
    protected selectionAnswers: string[];
    protected responseTimeout: NodeJS.Timeout;
    protected timedOutResponse: boolean;

    constructor(config: TTerminalConfig, protected logger: Logger, protected theme: Theme, protected ascii: Ascii) {
        super(config, logger, theme);
        this.listKeypressListener = (_: string, key: Key) => this.internalListKeypressListener(key);
        this.listResizeListener = () => this.internalListResizeListener();
        this.questionPrompt = this.theme.formatQuestion("[?]");
        this.passwordPrompt = this.theme.formatQuestion("[*]");
        this.interface.setPrompt(this.theme.formatQuestion("> "));
        this.hideCursor();
    }

    public async ask(text: string, options?: AskOptions): Promise<string | string[]> {
        this.answerCount = 0;
        this.timedOutResponse = false;
        this.logger
            .pushPrompt(options?.password ? this.passwordPrompt : this.questionPrompt)
            .notice(this.theme.formatQuestion(text))
            .clearCurrentPrompt();
        this.showCursor();
        let response: string | string[];
        if (options) {
            if (options.password) {
                response = await this.getResponse(`${text}\n`, true);
            } else if (options.answers) {
                if (options.multi) {
                    response = await this.getMultiAnswer(text, options.answers, options.descriptions || options.list);
                } else {
                    response = await this.getAnswer(text, options.answers, options.descriptions || options.list);
                }
            }
        } else {
            response = await this.getResponse(`${text}\n`);
        }
        this.hideCursor();
        if (response) {
            this.logger
                .notice(
                    this.theme.formatSuccess(
                        options?.password
                            ? "input stored"
                            : `${options?.answers ? "accepted " : ""}input: '${this.theme.formatQuestion(
                                  Array.isArray(response) ? response.join(", ") : response
                              )}'`
                    )
                )
                .popPrompt();
        }
        return response;
    }

    //#region INPUT

    protected async getAnswer(
        text: string,
        answers: string[],
        listDescriptions: string[] | boolean = false
    ): Promise<string> {
        const type = listDescriptions ? ListType.NUMERIC : null;
        let response = listDescriptions
            ? await this.getListResponse(
                  text,
                  answers,
                  typeof listDescriptions === "boolean" ? null : listDescriptions,
                  type
              )
            : await this.getResponse(`${text} (${answers.join("/")})\n`);
        if (response) {
            response = response.trim();
            if (type === ListType.NUMERIC && this.numberRe.test(response)) {
                const index = parseInt(response) - 1;
                if (index > -1 && index < answers.length) {
                    return answers[index];
                } else {
                    return this.failResponse(response, text, answers, listDescriptions, false) as Promise<string>;
                }
            }

            if (answers.indexOf(response) > -1) {
                return response;
            }
        }
        return this.failResponse(response, text, answers, listDescriptions, false) as Promise<string>;
    }

    protected async getMultiAnswer(
        text: string,
        answers: string[],
        listDescriptions: string[] | boolean = false
    ): Promise<string[]> {
        const type = listDescriptions ? ListType.MULTI_NUMERIC : null;
        let response = listDescriptions
            ? await this.getListResponse(
                  text,
                  answers,
                  typeof listDescriptions === "boolean" ? null : listDescriptions,
                  type
              )
            : await this.getResponse(`${text} (${answers.join("/")}) `);
        if (response) {
            response = response.trim();
            if (type === ListType.MULTI_NUMERIC && this.multipleNumberRe.test(response)) {
                const indices = response
                    .split(this.multipleSplitRe)
                    .map((str) => parseInt(str) - 1)
                    .sort();
                const len = answers.length;
                if (indices.some((v, i) => v < 0 || v >= len || indices.lastIndexOf(v) !== i)) {
                    return this.failResponse(response, text, answers, listDescriptions, true) as Promise<string[]>;
                }
                return indices.map((i) => answers[i]);
            }
            const candidates = response.split(this.multipleSplitRe);
            if (candidates.some((c) => answers.indexOf(c) === -1)) {
                return this.failResponse(response, text, answers, listDescriptions, true) as Promise<string[]>;
            }
            return candidates
                .map((c) => answers.indexOf(c))
                .sort()
                .map((i) => answers[i]);
        }
        return this.failResponse(response, text, answers, listDescriptions, true) as Promise<string[]>;
    }

    protected async getListResponse(
        text: string,
        answers: string[],
        descriptions?: string[],
        type = ListType.NUMERIC
    ): Promise<string> {
        this.selectionType = type;
        this.selectionAnswers = answers;
        this.selectionList = this.ascii.list(this.selectionAnswers, descriptions, type);
        if (this.selectionType === ListType.MULTI_NUMERIC) {
            text = this.theme.formatBullet("[ms] ") + text;
            this.nonMultiSelectionList = this.ascii.list(this.selectionAnswers, descriptions, ListType.NUMERIC);
            this.multiSelection = [];
        }
        if (this.ansi) {
            this.interface.setPrompt(this.theme.formatQuestion(`[${this.theme.formatCommand("left")} to interact] > `));
            process.stdin.on("keypress", this.listKeypressListener);
            process.stdout.on("resize", this.listResizeListener);
        } else {
            this.selectionList = this.nonMultiSelectionList;
        }
        let response = await this.getResponse(`${text}\n${this.selectionList.join("\n")}\n`);
        if (response === "") {
            if (this.multiSelection !== null) {
                response = this.multiSelection.map((i) => answers[i]).join(",");
            } else if (this.selection !== null) {
                response = answers[this.selection];
            }
        }
        this.selection = null;
        this.multiSelection = null;
        this.selectionAnswers = null;
        this.selectionList = null;
        this.nonMultiSelectionList = null;
        return response;
    }

    protected async getResponse(text: string, password: boolean = false): Promise<string> {
        this.logger.logAnsi(this.theme.formatQuestion(`${text}`));
        this.interface.prompt();
        this.interface.resume();
        if (password) {
            this.mute();
        }
        const input = await new Promise<string>((resolve) => {
            this.responseTimeout = setTimeout(() => resolve(this.endGetResponse(null, password, true)), 60000);
            this.interface.once("line", (answer: string) => resolve(this.endGetResponse(answer, password)));
        });
        return input;
    }

    protected endGetResponse(answer: string, password: boolean = false, timedOut: boolean = false): string {
        clearTimeout(this.responseTimeout);
        this.responseTimeout = null;
        if (timedOut) {
            this.timedOutResponse = true;
        }
        this.interface.pause();
        if (password) {
            this.unmute();
        }
        if (timedOut || password) {
            shell.echo();
        }
        return answer;
    }

    protected failResponse(
        response: string,
        text: string,
        answers: string[],
        listDescriptions: string[] | boolean = false,
        multi: boolean
    ): Promise<string | string[]> {
        this.answerCount++;
        if (this.timedOutResponse) {
            this.logger.error(`answer timeout`).popPrompt();
            return null;
        } else if (this.answerCount >= this.maxFailure) {
            this.logger.error(`wrong answer overflow`).popPrompt();
            return null;
        } else {
            if (multi) {
                shell.echo(
                    this.theme.formatFailure(
                        `wrong answer '${response}', please provide list of available ones (or indices)`
                    )
                );
                return this.getMultiAnswer(text, answers, listDescriptions);
            } else {
                shell.echo(
                    this.theme.formatFailure(
                        `wrong answer '${response}', please provide one of the available ones${
                            this.selectionType === ListType.NUMERIC ? " (or its index)" : ""
                        }`
                    )
                );
                return this.getAnswer(text, answers, listDescriptions);
            }
        }
    }

    //#endregion

    //#region RENDER

    protected renderListHighlight(
        selection: number,
        content: string,
        prevSelection: number = null,
        prevContent: string = null
    ): void {
        let log = "";
        if (prevSelection !== null) {
            log +=
                ansiEscapes.cursorMove(0, -prevSelection) +
                ansiEscapes.eraseLine +
                ansiEscapes.cursorTo(0) +
                this.theme.formatQuestion(prevContent);
        }
        if (selection !== null) {
            log +=
                ansiEscapes.cursorMove(0, (prevSelection || 0) - selection) +
                ansiEscapes.eraseLine +
                ansiEscapes.cursorTo(0) +
                this.theme.formatSelection(this.theme.formatQuestion(content)) +
                ansiEscapes.cursorMove(0, selection) +
                ansiEscapes.cursorTo(0);
        } else {
            log += ansiEscapes.cursorMove(0, prevSelection) + ansiEscapes.cursorTo(0);
        }
        this.logger.logAnsi(log);
    }

    protected renderNonMultiSelectionList(len: number): void {
        this.selectionList = this.nonMultiSelectionList;
        this.logger.logAnsi(
            ansiEscapes.cursorMove(0, -len) +
                ansiEscapes.cursorTo(0) +
                // erase selection prefix "[ ] " & possible monochrome marker " <<="
                this.theme.formatQuestion(`${this.selectionList.map((s) => s + " ".repeat(8)).join("\n")}\n`)
        );
    }

    //#endregion

    //#region LISTENERS

    protected internalListKeypressListener(key: Key): void {
        switch (key.name) {
            case "left":
                this.interactiveStart();
                break;
            case "up":
                this.interactiveMove(InteractiveMoveDirection.PREVIOUS);
                break;
            case "down":
                this.interactiveMove(InteractiveMoveDirection.NEXT);
                break;
            case "return":
                this.interactiveAccept();
                process.stdin.removeListener("keypress", this.listKeypressListener);
                process.stdout.removeListener("resize", this.listResizeListener);
                break;
            case "space":
                if (this.selectionType === ListType.MULTI_NUMERIC && this.selection !== null) {
                    this.interface.write(null, { name: "backspace" });
                    this.interactiveSelect();
                    break;
                }
            default:
                this.interactiveAbort(key);
                process.stdin.removeListener("keypress", this.listKeypressListener);
                process.stdout.removeListener("resize", this.listResizeListener);
                break;
        }
    }

    protected internalListResizeListener(): void {
        if (this.selection !== null) {
            this.renderListHighlight(this.selectionList.length - this.selection, this.selectionList[this.selection]);
        }
    }

    //#endregion

    //#region INTERACTIVITY

    protected interactiveStart(): void {
        if (this.selection === null) {
            this.hideCursor();
            this.logger.logAnsi(ansiEscapes.eraseLine);
            this.selection = 0;
            this.interface.setPrompt("");
            this.renderListHighlight(this.selectionList.length, this.selectionList[this.selection]);
        }
    }

    protected interactiveAbort(key: Key): void {
        let needsCursorAdjust = false;
        this.interface.setPrompt(this.theme.formatQuestion("> "));
        const len = this.selectionList.length;
        if (this.selection !== null) {
            if (key.sequence.length === 1) {
                this.interface.write(null, { name: "backspace" });
            }
            const prev = this.selection;
            this.selection = null;
            this.multiSelection = null;
            if (this.selectionType === ListType.NUMERIC) {
                this.renderListHighlight(null, null, len - prev, this.selectionList[prev]);
            } else {
                this.renderNonMultiSelectionList(len);
            }
            this.showCursor();
        } else {
            if (this.selectionType === ListType.MULTI_NUMERIC) {
                this.renderNonMultiSelectionList(len);
            }
            if (key.sequence.length === 1) {
                needsCursorAdjust = true;
            }
        }
        this.interface.prompt();
        if (needsCursorAdjust) {
            this.interface.write(null, { name: "right" });
        }
    }

    protected interactiveAccept(): void {
        if (this.selection !== null) {
            this.renderListHighlight(
                null,
                null,
                this.selectionList.length - this.selection + 1,
                this.selectionList[this.selection]
            );
            if (this.selectionType === ListType.NUMERIC) {
                shell.echo(
                    this.theme.formatQuestion(
                        ansiEscapes.cursorMove(0, -1) +
                            `> ${this.theme.formatBullet("[" + (this.selection + 1) + "]")} ${
                                this.selectionAnswers[this.selection]
                            }`
                    )
                );
            } else {
                if (this.multiSelection.length) {
                    this.multiSelection.sort();
                    shell.echo(
                        this.theme.formatQuestion(
                            ansiEscapes.cursorMove(0, -1) +
                                `> ${this.theme.formatBullet(
                                    "[" + this.multiSelection.map((i) => i + 1).join(", ") + "]"
                                )} ${this.multiSelection.map((i) => this.selectionAnswers[i]).join(", ")}`
                        )
                    );
                } else {
                    shell.echo(
                        this.theme.formatQuestion(
                            ansiEscapes.cursorMove(0, -1) + `> ${this.theme.formatBullet("empty")}`
                        )
                    );
                }
            }
        }
    }

    protected interactiveMove(direction: InteractiveMoveDirection): void {
        if (this.selection !== null) {
            const prev = this.selection;
            if (direction === InteractiveMoveDirection.PREVIOUS) {
                this.selection--;
                if (this.selection < 0) {
                    this.selection = this.selectionList.length - 1;
                }
            } else {
                this.selection++;
                if (this.selection === this.selectionList.length) {
                    this.selection = 0;
                }
            }
            this.renderListHighlight(
                this.selectionList.length - this.selection,
                this.selectionList[this.selection],
                this.selectionList.length - prev,
                this.selectionList[prev]
            );
        }
    }

    protected interactiveSelect(): void {
        const i = this.multiSelection.indexOf(this.selection);
        if (i > -1) {
            this.multiSelection.splice(i, 1);
            this.selectionList[this.selection] = this.selectionList[this.selection].replace(
                this.ascii.checkedSelectionIndicator,
                this.ascii.uncheckedSelectionIndicator
            );
        } else {
            this.multiSelection.push(this.selection);
            this.selectionList[this.selection] = this.selectionList[this.selection].replace(
                this.ascii.uncheckedSelectionIndicator,
                this.ascii.checkedSelectionIndicator
            );
        }
        this.renderListHighlight(this.selectionList.length - this.selection, this.selectionList[this.selection]);
    }

    //#endregion
}
