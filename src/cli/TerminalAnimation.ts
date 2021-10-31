import ansiEscapes from "ansi-escapes";

import FalkorError from "../error/FalkorError.js";
import Theme from "../util/Theme.js";

export const enum TerminalAnimationErrorCodes {
    FRAME_COUNT = "terminal-animation-frame-count",
    INVALID_FRAME = "terminal-animation-invalid-frame",
    PADDING = "terminal-animation-invalid-padding"
}

export default class TerminalAnimation {
    protected readonly empty: string;
    protected readonly endFrame: number;
    protected readonly printLength: number;

    protected currentFrame: number;
    protected extraPadding: number;
    protected intervalTimeout: NodeJS.Timeout;
    protected printed: boolean;
    protected frames: string[];

    /**
     * @throws FalkorError: TerminalAnimationErrorCodes.FRAME_COUNT
     * @throws FalkorError: TerminalAnimationErrorCodes.INVALID_FRAME
     */
    constructor(
        protected theme: Theme,
        protected streamLog: (str: string) => void,
        frames: string[] = ["$", ".", "..", "..."],
        protected frameMs: number = 500
    ) {
        if (frames.length < 2) {
            throw new FalkorError(TerminalAnimationErrorCodes.FRAME_COUNT, "TerminalAnimation: not enough frames");
        }
        if (frames.some((f) => /\n/.test(f))) {
            throw new FalkorError(
                TerminalAnimationErrorCodes.INVALID_FRAME,
                "TerminalAnimation: frame contains newline"
            );
        }
        this.endFrame = frames.length - 1;
        const maxLen = frames.reduce((acc, curr) => Math.max(acc, curr.length), 0);
        this.frames = frames.map((f) => " " + f.padEnd(maxLen, " "));
        this.printLength = maxLen + 1;
        this.empty = " ".repeat(this.printLength);
    }

    /** @throws FalkorError: TerminalAnimationErrorCodes.INVALID_PADDING */
    public async start(padding: number = 0): Promise<void> {
        if (padding < 0) {
            throw new FalkorError(
                TerminalAnimationErrorCodes.PADDING,
                "TerminalAnimation: started with negative padding"
            );
        }
        this.currentFrame = 0;
        this.extraPadding = padding === 0 ? 0 : padding - 1;
        this.printFrame();
        this.loop();
    }

    public stop(): void {
        clearInterval(this.intervalTimeout);
        this.clearFrame();
    }

    protected nextFrame(): void {
        if (this.currentFrame === this.endFrame) {
            this.currentFrame = 1;
        } else {
            this.currentFrame++;
        }
        this.printFrame();
    }

    public printFrame(): void {
        this.streamLog(
            (this.printed ? ansiEscapes.cursorBackward(this.printLength) : "".padEnd(this.extraPadding)) +
                this.theme.formatCommand(this.frames[this.currentFrame])
        );
        this.printed = true;
    }

    public clearFrame(): void {
        if (this.printed) {
            this.streamLog(
                ansiEscapes.cursorBackward(this.printLength) +
                    this.empty +
                    ansiEscapes.cursorBackward(this.printLength + this.extraPadding)
            );
            this.printed = false;
        }
    }

    protected loop(): void {
        this.intervalTimeout = setInterval(() => this.nextFrame(), this.frameMs);
    }
}
