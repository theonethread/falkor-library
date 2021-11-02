import ScriptHost from "../script/ScriptHost.js";
import FalkorError from "../error/FalkorError.js";
import Brand from "../util/Brand.js";
import falkorUtil from "../util/Util.js";

export const enum TaskHostErrorCodes {
    SUBTASK_ABORT = "host-subtask-abort",
    SUBTASK_ERROR = "host-subtask-error"
}

export default class TaskHost extends ScriptHost {
    protected readonly copyrightPrompt = "[C]";
    protected readonly debugPrompt = "[;]";
    protected readonly taskPrompt = "[#]";
    protected readonly panicPrompt = "[P]";
    protected readonly abortPrompt = "[A]";
    protected readonly infoPrompt = "[i]";
    protected readonly warningPrompt = "[w]";
    protected readonly errorPrompt = "[!]";
    protected readonly breadcrumbJoiner = " > ";
    protected readonly brand: Brand;
    protected readonly times: [number, number][] = [];
    protected readonly subtaskTitles: string[] = [];

    public get breadcrumbs(): string {
        return this.subtaskTitles.join(this.breadcrumbJoiner);
    }

    constructor(protected appName: string = "Sequencer", answerBuffer: string[]) {
        super(answerBuffer);

        this.brand = new Brand(this.config.brand, this.ascii, appName);
        this.logger
            .pushPrompt(this.theme.formatBrand(this.copyrightPrompt))
            .info(this.theme.formatBrand(this.brand.title))
            .popPrompt()
            .pushPrompt(this.debugPrompt)
            .debug(`${this.theme.formatBullet("CONFIG:")} ${JSON.stringify(this.config)}`)
            .debug(`${this.theme.formatBullet("ANSWER BUFFER:")} ${JSON.stringify(answerBuffer)}`)
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
                )} (${text} ${this.theme.formatTrace(`in ${falkorUtil.prettyTime(process.hrtime(this.times.pop()))}`)})`
            )
            .popPrompt();
    }

    /** @throws FalkorError: TaskHostErrorCodes.SUBTASK_ABORT */
    protected endSubtaskAbort(
        text: string,
        final: boolean = false,
        soft: boolean = false,
        error?: Error
    ): Error | FalkorError {
        if (this.aborted) {
            return null;
        }
        if (final) {
            this.aborted = true;
            this.subtaskTitles.length = 1;
            this.times.length = 1;
            this.logger.emptyPrompt(1);
        }
        this.logger
            .warning(
                `${this.theme.formatTask(this.subtaskTitles.pop())} subtask abort ${this.theme.formatInfo(
                    `(${text} ${this.theme.formatTrace(
                        `in ${falkorUtil.prettyTime(process.hrtime(this.times.pop()))}`
                    )})`
                )}`
            )
            .popPrompt();
        const e = error || new FalkorError(TaskHostErrorCodes.SUBTASK_ABORT, "TaskHost: subtask abort");
        if (soft) {
            return e;
        }
        this.logger.debug(
            `${this.debugPrompt} throwing '${this.theme.formatWarning(TaskHostErrorCodes.SUBTASK_ABORT)}'`
        );
        throw e;
    }

    /** @throws FalkorError: TaskHostErrorCodes.SUBTASK_ERROR */
    protected endSubtaskError(
        text: string,
        final: boolean = false,
        soft: boolean = false,
        error?: Error
    ): Error | FalkorError {
        if (this.aborted) {
            return null;
        }
        if (final) {
            this.aborted = true;
            this.subtaskTitles.length = 1;
            this.times.length = 1;
        }
        this.logger
            .error(
                `${this.theme.formatTask(this.subtaskTitles.pop())} subtask error ${this.theme.formatInfo(
                    `(${text} ${this.theme.formatTrace(
                        `in ${falkorUtil.prettyTime(process.hrtime(this.times.pop()))}`
                    )})`
                )}`
            )
            .popPrompt();
        const e = error || new FalkorError(TaskHostErrorCodes.SUBTASK_ERROR, "TaskHost: subtask error");
        if (soft) {
            return e;
        }
        this.logger.debug(`${this.debugPrompt} throwing '${this.theme.formatFatal(TaskHostErrorCodes.SUBTASK_ERROR)}'`);
        throw e;
    }
}
