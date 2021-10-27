import semver from "semver";
import { RequestInit } from "node-fetch";

import { TExecOptions, TExecReturnValue, TFetchReturnValue, TSubShell } from "../script/ScriptHost.js";
import { AskOptions } from "../cli/Terminal.js";
import TaskHost, { TaskHostErrorCodes } from "./TaskHost.js";
import Task from "./Task.js";
import Logger from "../cli/Logger.js";
import FalkorError from "../error/FalkorError.js";
import Ascii from "../util/Ascii.js";
import Theme from "../util/Theme.js";

export type TaskOptions = {
    theme: Theme;
    logger: Logger;
    ascii: Ascii;
    shell: TSubShell;
    ask: (text: string, options?: AskOptions) => Promise<string | string[]>;
    exec: (command: string, options?: TExecOptions) => Promise<TExecReturnValue>;
    fetchText: (url: string, options?: RequestInit) => Promise<TFetchReturnValue<string>>;
    fetchJson: <T = any>(url: string, options?: RequestInit) => Promise<TFetchReturnValue<T>>;
    subtask: (title: string) => void;
    success: (text: string) => void;
    abort: (text: string) => void;
    error: (text: string) => void;
};

export type TDependency<T extends string | semver.SemVer> = {
    command: string;
    versionMatch: RegExp;
    minVersion: T;
};

export type TCommandDependencies<T extends string | semver.SemVer> = {
    [id: string]: TDependency<T>;
};

export type TLazyCommandDependencies = {
    [id: string]:
        | {
              command?: string;
              versionMatch?: RegExp;
              minVersion: string;
          }
        | string;
};

export const enum TaskRunnerErrorCodes {
    DUPLICATE_ID = "runner-id-duplicate",
    INVALID_ID = "runner-id-invalid"
}

export default class TaskRunner extends TaskHost {
    protected readonly prefix = this.theme.formatBrand("FALKOR:");
    protected readonly versionRe = /version\s*([^\s]+)/;
    protected readonly collection: { [id: string]: Task } = {};
    protected readonly taskOptions: TaskOptions = {
        theme: this.theme,
        logger: this.logger,
        ascii: this.ascii,
        shell: this.shell,
        ask: (text: string, options?: AskOptions) => this.terminal.ask(text, options),
        exec: (command: string, options?: TExecOptions) => this.exec(command, options),
        subtask: (title: string) => this.startSubtask(title),
        fetchText: (url: string, options: RequestInit = null) => this.fetchText(url, options),
        fetchJson: <T = any>(url: string, options: RequestInit = null) => this.fetchJson<T>(url, options),
        success: (text: string) => this.endSubtaskSuccess(text),
        abort: (text: string) => this.endSubtaskAbort(text),
        error: (text: string) => this.endSubtaskError(text)
    };
    // NOTE: throwing from the listener will not be caught by async try-catch
    protected readonly sigintListener = () => this.handleError(this.endSubtaskAbort("received 'SIGINT'", false, true));
    protected currentSequence: string[];
    protected currentIndex: number = null;
    protected currentTask: Task = null;

    constructor(appName?: string, answerBuffer: string[] = null) {
        super(appName, answerBuffer);
        Object.freeze(this.taskOptions);
    }

    /** @throws FalkorError: TaskRunnerErrorCodes.DUPLICATE_ID */
    public register(task: Task): void {
        if (this.collection[task.id]) {
            throw new FalkorError(TaskRunnerErrorCodes.DUPLICATE_ID, `TaskRunner: duplicate id '${task.id}'`);
        }
        this.collection[task.id] = task;
        task.setup(this.taskOptions);
    }

    public async run(idArr?: string | string[]): Promise<void> {
        const dependencies: TCommandDependencies<semver.SemVer> = {};
        if (!idArr) {
            idArr = Object.keys(this.collection);
        } else if (!Array.isArray(idArr)) {
            idArr = [idArr];
        }
        this.currentSequence = idArr;
        try {
            this.mergeDependencies(dependencies);
            await this.checkDependencies(dependencies);
            await this.runSequence();
        } catch (error) {
            await this.handleError(error);
        }
    }

    /** @throws FalkorError: TaskRunnerErrorCodes.INVALID_ID */
    protected mergeDependencies(target: TCommandDependencies<semver.SemVer>): void {
        this.startSubtask(`${this.prefix} Dependency Merge`);
        this.currentSequence.forEach((id: string) => {
            const task = this.collection[id];
            if (!task) {
                throw new FalkorError(TaskRunnerErrorCodes.INVALID_ID, `TaskRunner: invalid task id '${id}'`);
            }
            if (task.dependencies) {
                for (const key of Object.keys(task.dependencies)) {
                    let s: TDependency<string>;
                    if (typeof task.dependencies[key] === "string") {
                        s = {
                            command: `${key} --version`,
                            versionMatch: this.versionRe,
                            minVersion: task.dependencies[key] as string
                        };
                    } else {
                        s = task.dependencies[key] as TDependency<string>;
                    }
                    const t = target[key];
                    if (t) {
                        const newMinVersion = semver.coerce(s.minVersion);
                        if (!semver.eq(t.minVersion, newMinVersion)) {
                            this.logger.warning(
                                `[!] shared dependency '${this.theme.formatCommand(
                                    key
                                )}' version mismatch ${this.theme.formatInfo(`(${t.minVersion} / ${newMinVersion})`)}`
                            );
                        }
                        if (semver.lt(t.minVersion, newMinVersion)) {
                            t.minVersion = newMinVersion;
                            t.versionMatch = s.versionMatch;
                        }
                    } else {
                        target[key] = {
                            command: s.command || `${key} --version`,
                            versionMatch: s.versionMatch || this.versionRe,
                            minVersion: semver.coerce(s.minVersion)
                        };
                    }
                }
            }
        });
        this.endSubtaskSuccess("merged");
    }

    protected async checkDependencies(dependencies: TCommandDependencies<semver.SemVer>): Promise<void> {
        const keys = Object.keys(dependencies);
        if (keys.length) {
            this.startSubtask(`${this.prefix} Dependency Check`);
            for (const dep of keys) {
                this.logger.info(`[i] checking '${this.theme.formatCommand(dep)}'`).pushPrompt();
                const d = dependencies[dep];
                const ret = await this.exec(d.command);
                if (!ret.success) {
                    this.endSubtaskError(`failed dependency '${dep}'`);
                }
                const v = ret.output.match(d.versionMatch);
                if (!v) {
                    this.endSubtaskError(`failed version check '${this.theme.formatCommand(dep)}': ${d.versionMatch}`);
                }
                const version = semver.coerce(v[1]);
                if (semver.lt(version, d.minVersion)) {
                    this.endSubtaskError(
                        `bad version: '${this.theme.formatCommand(dep)}' ${version} < ${d.minVersion}`
                    );
                }
                this.logger
                    .info(`${this.theme.formatSuccess("succeeded")} (${version} >= ${d.minVersion})`)
                    .popPrompt();
            }
            this.endSubtaskSuccess("all passed");
        }
    }

    protected async runSequence(): Promise<void> {
        this.startSubtask(`${this.prefix} Sequencer`);
        this.currentIndex = -1;
        for (const id of this.currentSequence) {
            this.currentIndex++;
            this.currentTask = this.collection[id];
            this.startSubtask(this.currentTask.id);
            process.once("SIGINT", this.sigintListener);
            await this.currentTask.run();
            process.removeListener("SIGINT", this.sigintListener);
            this.endSubtaskSuccess("finished task");
        }
        this.currentIndex = null;
        this.currentTask = null;
        this.currentSequence = null;
        this.endSubtaskSuccess("done");
    }

    protected handleError(error: Error): void {
        this.logger.emptyPrompt(1);
        const isAbort = error instanceof FalkorError && error.code === TaskHostErrorCodes.SUBTASK_ABORT;
        if (isAbort) {
            this.logAbort();
            this.logger.pushPrompt();
            if (this.currentTask.cancel) {
                this.currentTask.cancel(isAbort);
            }
            this.logger.popPrompt();
            this.endSubtaskAbort("sequence aborted", true);
        } else {
            this.logError(error);
            this.logger.pushPrompt();
            if (this.currentTask.cancel) {
                this.currentTask.cancel(isAbort);
            }
            this.logger.popPrompt();
            this.endSubtaskError("sequence failed", true);
        }
        process.exit(1);
    }

    protected logAbort(): void {
        this.logger.fatal(
            `${this.abortPrompt} aborted ${this.theme.formatInfo(
                `(${this.breadcrumbs}${this.currentTask ? this.breadcrumbJoiner + this.currentTask.id : ""})`
            )}`
        );
    }

    protected logError(error: Error): void {
        this.logger
            .fatal(
                `${this.panicPrompt} failed ${this.theme.formatInfo(
                    `(${this.breadcrumbs}${this.currentTask ? this.breadcrumbJoiner + this.currentTask.id : ""})`
                )}`
            )
            .debug(`${this.debugPrompt} ${error.stack ? error.stack : error.name + ": " + error.message}`);
    }
}
