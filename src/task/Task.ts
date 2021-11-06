import { RequestInit } from "node-fetch";

import { TTaskSetupOptions, TLazyCommandDependencies } from "./TaskRunner.js";
import { TSubShell, TExecOptions, TExecReturnValue, TFetchReturnValue } from "../script/ScriptHost.js";
import { TAskOptions } from "../cli/Terminal.js";
import Theme from "../util/Theme.js";
import Logger from "../cli/Logger.js";
import util from "../util/Util.js";
import Ascii from "../util/Ascii.js";

export default abstract class Task {
    protected theme: Theme;
    protected logger: Logger;
    protected ascii: Ascii;
    protected shell: TSubShell;
    protected ask: (text: string, options?: TAskOptions) => Promise<string | string[]>;
    protected exec: (command: string, options?: TExecOptions) => Promise<TExecReturnValue>;
    protected fetchText: (url: string, options?: RequestInit) => Promise<TFetchReturnValue<string>>;
    protected fetchJson: <T = any>(url: string, options?: RequestInit) => Promise<TFetchReturnValue<T>>;
    protected subtask: (title: string) => void;
    protected success: (text: string) => void;
    /** @throws !always FalkorError: TaskHostErrorCodes.SUBTASK_ABORT */
    protected abort: (text: string) => void;
    /** @throws !always FalkorError: TaskHostErrorCodes.SUBTASK_ERROR */
    protected error: (text: string) => void;

    public get [Symbol.toStringTag](): string {
        return "@FalkorTask";
    }

    public get dependencies(): TLazyCommandDependencies {
        return this.deps;
    }

    constructor(protected taskId: string, private readonly deps: TLazyCommandDependencies = null) {
        if (this.deps) {
            util.deepFreeze(this.deps);
        }
    }

    public get id(): string {
        return this.taskId;
    }

    public setup(opts: TTaskSetupOptions): void {
        this.theme = opts.theme;
        this.logger = opts.logger;
        this.ascii = opts.ascii;
        this.shell = opts.shell;
        this.ask = opts.ask;
        this.exec = opts.exec;
        this.fetchText = opts.fetchText;
        this.fetchJson = opts.fetchJson;
        this.subtask = opts.subtask;
        this.success = opts.success;
        this.abort = opts.abort;
        this.error = opts.error;
    }

    public abstract run(argv?: { [key: string]: any }, config?: any): Promise<void>;

    public cancel?(isAbort: boolean): void;
}
