import Terminal, { TAskOptions } from "./Terminal.js";
import Logger from "../cli/Logger.js";
import Theme from "../util/Theme.js";
import Ascii, { ListType } from "../util/Ascii.js";
import { TTerminalConfig } from "../config/Config.js";

export default class BufferedTerminal extends Terminal {
    constructor(
        config: TTerminalConfig,
        protected logger: Logger,
        protected theme: Theme,
        protected ascii: Ascii,
        protected buffer: string[] = null
    ) {
        super(config, logger, theme, ascii);
    }

    public async ask(text: string, options?: TAskOptions): Promise<string | string[]> {
        if (this.aborted) {
            return null;
        }

        const buffered = this.buffer?.shift();
        if (buffered) {
            this.logger
                .pushPrompt(options?.password ? this.passwordPrompt : this.questionPrompt)
                .notice(this.theme.formatQuestion(text))
                .clearCurrentPrompt();
            let response: string | string[];
            if (options?.password) {
                this.logger.warning("using buffered password");
                response = buffered;
            } else if (options?.answers) {
                this.sanitizeOptionAnswers(options);
                if (options.multi) {
                    response = this.validateMultiAnswer(
                        buffered,
                        options.answers,
                        options.descriptions || options.list ? ListType.MULTI_NUMERIC : null,
                        options.allowNone
                    );
                } else {
                    response = this.validateAnswer(
                        buffered,
                        options.answers,
                        options.descriptions || options.list ? ListType.NUMERIC : null,
                        options.allowNone
                    );
                }
            } else {
                response = buffered;
            }
            if (response) {
                this.logger
                    .notice(
                        this.theme.formatSuccess(
                            options?.password
                                ? "buffered input stored"
                                : `${options?.answers ? "accepted " : ""}buffered input: '${this.theme.formatQuestion(
                                      options.allowNone &&
                                          ((Array.isArray(response) && response.length === 0) || response === "")
                                          ? "NONE"
                                          : Array.isArray(response)
                                          ? response.join(", ")
                                          : response
                                  )}'`
                        )
                    )
                    .popPrompt();
                return response;
            }
            this.logger
                .warning(
                    options?.password
                        ? "buffered input failure"
                        : `failed buffered input: '${this.theme.formatQuestion(buffered)}'`
                )
                .popPrompt();
            return null;
        }

        return super.ask(text, options);
    }
}
