import { posix as path } from "path";
import { fileURLToPath } from "url";
import { ChildProcess } from "child_process";
import shell from "shelljs";
import fetch, { RequestInit } from "node-fetch";

import Config from "../config/Config.js";
import Logger, { LogLevel } from "../cli/Logger.js";
import BufferedTerminal from "../cli/BufferedTerminal.js";
import Ascii from "../util/Ascii.js";
import Theme from "../util/Theme.js";

export type TExecOptions = {
    noError?: RegExp[];
} & shell.ExecOptions;

export type TExecReturnValue = {
    success: boolean;
    code: number;
    output: string;
};

export type TFetchReturnValue<T> = {
    success: boolean;
    status: number;
    body: T;
};

export type TModuleParameters = {
    root: string;
    params: { [key: string]: string };
};

export type TSubShell = {
    ShellString: typeof shell.ShellString;
    ls: typeof shell.ls;
    find: typeof shell.find;
    cat: typeof shell.cat;
    head: typeof shell.head;
    tail: typeof shell.tail;
    test: typeof shell.test;
    which: typeof shell.which;
    mkdir: typeof shell.mkdir;
    cp: typeof shell.cp;
    rm: typeof shell.rm;
    mv: typeof shell.mv;
    ln: typeof shell.ln;
    chmod: typeof shell.chmod;
    sed: typeof shell.sed;
    grep: typeof shell.grep;
};

export default class ScriptHost {
    protected readonly cwd = process.cwd().replace(/\\/g, "/");
    protected readonly defaultExecOptions = {
        silent: true,
        async: true
    };
    protected readonly defaultFetchTextOptions = {
        method: "GET",
        headers: {
            "Content-Type": "text/plain"
        }
    };
    protected readonly defaultFetchJsonOptions = {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        }
    };
    protected readonly config: Config;
    protected readonly theme: Theme;
    protected readonly ascii: Ascii;
    protected readonly logger: Logger;
    protected readonly terminal: BufferedTerminal;
    protected readonly commandPrompt: string;
    protected readonly fetchPrompt: string;
    protected readonly shell: TSubShell = {
        ShellString: shell.ShellString,
        ls: shell.ls,
        find: shell.find,
        cat: shell.cat,
        head: shell.head,
        tail: shell.tail,
        test: shell.test,
        which: shell.which,
        mkdir: shell.mkdir,
        cp: shell.cp,
        rm: shell.rm,
        mv: shell.mv,
        ln: shell.ln,
        chmod: shell.chmod,
        sed: shell.sed,
        grep: shell.grep
    };

    constructor(answerBuffer: string[]) {
        this.config = new Config();
        this.theme = new Theme(this.config.theme);
        this.ascii = new Ascii(this.theme);
        this.logger = new Logger(this.config.logger, this.theme);
        this.terminal = new BufferedTerminal(this.config.terminal, this.logger, this.theme, this.ascii, answerBuffer);
        this.commandPrompt = this.theme.formatCommand("[$]");
        this.fetchPrompt = this.theme.formatCommand("[@]");
        Object.freeze(this.shell);
        shell.config.silent = true;
    }

    protected async exec(command: string, options?: TExecOptions & shell.ExecOptions): Promise<TExecReturnValue> {
        this.logger
            .pushPrompt(this.commandPrompt)
            .notice(
                this.theme.formatCommand(command),
                `(cwd: ${this.theme.formatPath(options?.cwd ? path.join(this.cwd, options.cwd.toString()) : this.cwd)})`
            )
            .clearCurrentPrompt();
        const streamFn = this.terminal.startStream(LogLevel.DEBUG);
        return new Promise((resolve) => {
            const child = shell.exec(
                command,
                options ? Object.assign(options, this.defaultExecOptions) : this.defaultExecOptions
            ) as ChildProcess;
            child.stdout.on("data", (chunk) => streamFn(chunk));
            child.stderr.on("data", (chunk) => streamFn(chunk, true));
            child.once("close", (code: number) => {
                const output = this.terminal.endStream();
                child.stdout.removeAllListeners("data");
                child.stderr.removeAllListeners("data");
                if (code !== 0) {
                    if (options?.noError) {
                        for (const pattern of options.noError) {
                            if (pattern.test(output)) {
                                this.logger
                                    .notice(
                                        `${this.theme.formatSuccess(
                                            "succeeded"
                                        )} (code: ${code}, exception silenced by pattern '${pattern}')`
                                    )
                                    .popPrompt();
                                return resolve({
                                    success: true,
                                    code,
                                    output
                                });
                            }
                        }
                    }
                    this.logger.error(`failed on exception (code: ${code})`).popPrompt();
                    return resolve({
                        success: false,
                        code,
                        output
                    });
                }
                this.logger.notice(`${this.theme.formatSuccess("succeeded")} (code: 0)`).popPrompt();
                return resolve({
                    success: true,
                    code,
                    output
                });
            });
        });
    }

    protected async fetchText(url: string, options: RequestInit = null): Promise<TFetchReturnValue<string>> {
        options = this.sanitizeFetchOptions(this.defaultFetchTextOptions, options);
        this.logger
            .pushPrompt(this.fetchPrompt)
            .notice("fetchText:", this.theme.formatCommand(url), JSON.stringify(options, null, 2))
            .clearCurrentPrompt();
        const res = await fetch(url, options);
        const text = await res.text();
        const ret = {
            success: res.ok,
            status: res.status,
            body: text
        };
        this.logger.debug(`body: ${text}`);
        if (res.ok) {
            this.logger.notice(`${this.theme.formatSuccess("succeeded")} (status: ${res.status} - ${res.statusText})`);
        } else {
            this.logger.error(
                `fetchText '${this.theme.formatPath(url)}' failed ${this.theme.formatInfo(
                    `(status: ${res.status} - ${res.statusText})`
                )}`
            );
        }
        this.logger.popPrompt();
        return ret;
    }

    protected async fetchJson<T>(url: string, options: RequestInit = null): Promise<TFetchReturnValue<T>> {
        options = this.sanitizeFetchOptions(this.defaultFetchJsonOptions, options);
        this.logger
            .pushPrompt(this.fetchPrompt)
            .notice("fetchJson:", this.theme.formatCommand(url), JSON.stringify(options, null, 2))
            .clearCurrentPrompt();
        const res = await fetch(url, options);
        let decoded: any;
        try {
            decoded = await res.json();
        } catch (e) {
            this.logger.warning("JSON parsing failed");
            decoded = await res.text();
        }
        const ret = {
            success: res.ok,
            status: res.status,
            body: decoded
        };
        this.logger.debug(`body: ${typeof decoded === "string" ? decoded : JSON.stringify(decoded, null, 2)}`);
        if (res.ok) {
            this.logger.notice(`${this.theme.formatSuccess("succeeded")} (status: ${res.status} - ${res.statusText})`);
        } else {
            this.logger.error(
                `fetchJson '${this.theme.formatPath(url)}' failed ${this.theme.formatInfo(
                    `(status: ${res.status} - ${res.statusText})`
                )}`
            );
        }
        this.logger.popPrompt();
        return ret;
    }

    protected sanitizeFetchOptions(builtIn: RequestInit, options: RequestInit): RequestInit {
        if (!options) {
            options = {};
        }
        if (!options.method) {
            options.method = builtIn.method;
        }
        if (!options.headers) {
            options.headers = {};
        }
        if (!(options.headers as { [key: string]: string })["Content-Type"]) {
            (options.headers as { [key: string]: string })["Content-Type"] = (
                builtIn.headers as {
                    [key: string]: string;
                }
            )["Content-Type"];
        }
        return options;
    }

    protected getModuleParameters(fileUrl: string, ...correctionSegments: string[]): TModuleParameters {
        return {
            root: path.join(path.dirname(fileURLToPath(fileUrl)), ...correctionSegments),
            params: Object.fromEntries(new URL(fileUrl).searchParams)
        };
    }
}
