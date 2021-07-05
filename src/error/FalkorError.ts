export default class FalkorError extends Error {
    public readonly code: string;

    constructor(code: string, message: string, type: string = "") {
        super(message);
        this.code = code;
        this.name = `Falkor${type}Error`;
    }
}
