export enum ExitCode {
    GENERAL = 1,
    ABORT = 2,
    VALIDATION = 3
}

export default class FalkorError extends Error {
    public readonly code: string;
    public readonly exitCode: number;

    constructor(code: string, message: string, exitCode: number = 1, type: string = "") {
        super(message);
        this.code = code;
        this.exitCode = exitCode;
        this.name = `Falkor${type}Error`;
    }
}
