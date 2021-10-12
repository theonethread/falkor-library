import prettify from "pretty-time";

import { ScriptHost } from "../script/ScriptHost.js";
import { FalkorError } from "../error/FalkorError.js";
import { Brand } from "../util/Brand.js";
import { LogLevel } from "../cli/Logger.js";

export const enum TaskHostErrorCodes {
    SUBTASK_ABORT = "host-subtask-abort",
    SUBTASK_ERROR = "host-subtask-error"
}

export class TaskHost extends ScriptHost {
    protected readonly copyrightPrompt = "[C]";
    protected readonly debugPrompt = "[;]";
    protected readonly taskPrompt = "[#]";
    protected readonly panicPrompt = "[P]";
    protected readonly abortPrompt = "[A]";
    protected readonly breadcrumbJoiner = " > ";
    protected readonly brand: Brand;
    protected readonly times: [number, number][] = [];
    protected readonly subtaskTitles: string[] = [];

    public get breadcrumbs(): string {
        return this.subtaskTitles.join(this.breadcrumbJoiner);
    }

    constructor(protected appName: string = "Sequencer") {
        super();

        this.brand = new Brand(this.config.brand, this.ascii, appName);
        this.logger
            .pushPrompt(this.theme.formatBrand(this.copyrightPrompt))
            .info(this.theme.formatBrand(this.brand.title))
            .popPrompt()
            .pushPrompt(this.theme.formatDebug(this.debugPrompt))
            .debug(
                `${this.theme.formatSeverityError(LogLevel.DEBUG, "CONFIG:")} ${JSON.stringify(this.config, null, 2)}`
            )
            .popPrompt();
    }

    protected startSubtask(title: string): void {
        this.subtaskTitles.push(title);
        this.logger.info(`${this.theme.formatTask(`${this.taskPrompt} ${title}`)} starting`).pushPrompt();
        this.times.push(process.hrtime());
    }

    protected endSubtaskSuccess(text: string): void {
        this.logger
            .info(
                `${this.theme.formatTask(this.subtaskTitles.pop())} ${this.theme.formatSuccess(
                    "succeeded"
                )} (${text} ${this.theme.formatTrace(`in ${prettify(process.hrtime(this.times.pop()))}`)})`
            )
            .popPrompt();
    }

    /** @throws FalkorError: TaskHostErrorCodes.SUBTASK_ABORT */
    protected endSubtaskAbort(text: string, final: boolean = false): void {
        if (final) {
            this.subtaskTitles.length = 1;
            this.times.length = 1;
            this.logger.emptyPrompt(1);
        }
        this.logger
            .warning(
                `${this.theme.formatTask(this.subtaskTitles.pop())} subtask abort ${this.theme.formatInfo(
                    `(${text} ${this.theme.formatTrace(`in ${prettify(process.hrtime(this.times.pop()))}`)})`
                )}`
            )
            .popPrompt()
            .debug(`${this.debugPrompt} throwing '${this.theme.formatWarning(TaskHostErrorCodes.SUBTASK_ABORT)}'`);
        if (!final) {
            throw new FalkorError(TaskHostErrorCodes.SUBTASK_ABORT, "TaskHost: subtask abort");
        }
    }

    /** @throws FalkorError: TaskHostErrorCodes.SUBTASK_ERROR */
    protected endSubtaskError(text: string, final: boolean = false): void {
        if (final) {
            this.subtaskTitles.length = 1;
            this.times.length = 1;
        }
        this.logger
            .error(
                `${this.theme.formatTask(this.subtaskTitles.pop())} subtask error ${this.theme.formatInfo(
                    `(${text} ${this.theme.formatTrace(`in ${prettify(process.hrtime(this.times.pop()))}`)})`
                )}`
            )
            .popPrompt()
            .debug(`${this.debugPrompt} throwing '${this.theme.formatFatal(TaskHostErrorCodes.SUBTASK_ERROR)}'`);
        if (!final) {
            throw new FalkorError(TaskHostErrorCodes.SUBTASK_ERROR, "TaskHost: subtask error");
        }
    }
}
