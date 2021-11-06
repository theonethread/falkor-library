import process from "process";
import { posix as path } from "path";
import { fileURLToPath } from "url";
import prettyTime from "pretty-time";

export type TModuleParameters = {
    root: string;
    params: { [key: string]: string };
};

export class Util {
    protected readonly tokenizer = /(?:"(?:[^"\\]|\\[\S\s])*?"|'(?:[^'\\]|\\[\S\s])*?'|(?:\\\s|\S)+)(?=\s|$)/g;
    protected posixReplacerRe = /\\/g;
    protected moduleParameters: TModuleParameters;
    protected initialized: boolean = false;
    protected _cwd: string;

    public get cwd(): string {
        return this._cwd;
    }

    public get root(): string {
        return this.moduleParameters.root;
    }

    public get params(): { [key: string]: string } {
        return this.moduleParameters.params;
    }

    public init(fileUrl: string): void {
        if (this.initialized) {
            throw new Error("Tried to re-initialize Util instance!");
        }
        // index.js always lives in the .dist directory, we walk upwards from there assuming global install:
        // <root>/node_modules/@falkor/falkor-library/.dist
        this.moduleParameters = this.getModuleParameters(fileUrl, "../../../..");
        this._cwd = this.toPosixPath(process.cwd());
        this.initialized = true;
    }

    public deepFreeze(object: any): void {
        for (const name of Object.getOwnPropertyNames(object)) {
            const value = object[name];
            if (value && typeof value === "object") {
                this.deepFreeze(value);
            }
        }
        Object.freeze(object);
    }

    public getClassChain(item: any): string[] {
        const t = typeof item;
        if (t !== "object") {
            return [t];
        }
        const ret: string[] = [];
        while ((item = Object.getPrototypeOf(item))) {
            ret.push(item.constructor.name);
        }
        return ret;
    }

    public cliTokenize(input: string): string[] {
        return input.match(this.tokenizer);
    }

    public prettyTime(time: bigint | number | number[] | string[]): string {
        if (typeof time === "bigint") {
            time = Number(time);
        }
        return prettyTime(time);
    }

    public getModuleParameters(fileUrl: string, ...correctionSegments: string[]): TModuleParameters {
        console.log(fileUrl);
        console.log(fileURLToPath(fileUrl));
        console.log(path.dirname(this.toPosixPath(fileURLToPath(fileUrl))));
        return {
            root: path.join(path.dirname(this.toPosixPath(fileURLToPath(fileUrl))), ...correctionSegments),
            params: Object.fromEntries(new URL(fileUrl).searchParams)
        };
    }

    public toPosixPath(pathStr: string): string {
        return pathStr.replace(this.posixReplacerRe, "/");
    }
}

export default new Util();
