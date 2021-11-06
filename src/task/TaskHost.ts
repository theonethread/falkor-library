import process from "process";
import ScriptHost from "../script/ScriptHost.js";
import FalkorError, { ExitCode } from "../error/FalkorError.js";
import Brand from "../util/Brand.js";
import falkorUtil from "../util/Util.js";

export const enum TaskHostErrorCodes {
    SUBTASK_ABORT = "host-subtask-abort",
    SUBTASK_ERROR = "host-subtask-error",
    INVALID_SUBTASK_CLOSING = "host-subtask-closing"
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
    protected readonly times: bigint[] = [];
    protected readonly subtaskTitles: string[] = [];
    protected finalTaskCount = 1;
    protected finalTimeCount = 1;
    protected finalPromptCount = 1;

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
        this.times.push(process.hrtime.bigint());
    }

    protected endSubtaskSuccess(text: string): void {
        this.logger
            .info(
                `${this.theme.formatTask(this.subtaskTitles.pop())} ${this.theme.formatSuccess(
                    "succeeded"
                )} (${text} ${this.formatElapsedTime()})`
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
            this.subtaskTitles.length = this.finalTaskCount;
            this.times.length = this.finalTimeCount;
            this.logger.emptyPrompt(this.finalTaskCount);
        }
        this.logger
            .warning(
                `${this.theme.formatTask(this.subtaskTitles.pop())} subtask abort ${this.theme.formatInfo(
                    `(${text} ${this.formatElapsedTime()})`
                )}`
            )
            .popPrompt();
        const e =
            error || new FalkorError(TaskHostErrorCodes.SUBTASK_ABORT, "subtask abort", ExitCode.ABORT, "TaskHost");
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
            this.subtaskTitles.length = this.finalTaskCount;
            this.times.length = this.finalTimeCount;
            this.logger.emptyPrompt(this.finalPromptCount);
        }
        this.logger
            .error(
                `${this.theme.formatTask(this.subtaskTitles.pop())} subtask error ${this.theme.formatInfo(
                    `(${text} ${this.formatElapsedTime()})`
                )}`
            )
            .popPrompt();
        const e =
            error || new FalkorError(TaskHostErrorCodes.SUBTASK_ERROR, "subtask error", ExitCode.GENERAL, "TaskHost");
        if (soft) {
            return e;
        }
        this.logger.debug(`${this.debugPrompt} throwing '${this.theme.formatFatal(TaskHostErrorCodes.SUBTASK_ERROR)}'`);
        throw e;
    }

    protected formatElapsedTime(): string {
        return this.theme.formatTrace(`in ${falkorUtil.prettyTime(this.calcElapsedTime())}`);
    }

    protected calcElapsedTime(): number {
        return Number(process.hrtime.bigint() - this.times.pop());
    }

    protected checkInvalidSubtaskClosing() {
        if (this.subtaskTitles.length <= this.finalTaskCount || this.times.length <= this.finalTimeCount) {
            throw new FalkorError(
                TaskHostErrorCodes.INVALID_SUBTASK_CLOSING,
                "invalid subtask closing",
                ExitCode.VALIDATION,
                "TaskHost"
            );
        }
    }
}
