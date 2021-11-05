import prettyTime from "pretty-time";

class Util {
    private readonly tokenizer = /(?:"(?:[^"\\]|\\[\S\s])*?"|'(?:[^'\\]|\\[\S\s])*?'|(?:\\\s|\S)+)(?=\s|$)/g;

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

    public prettyTime(time: number | number[] | string[]): string {
        return prettyTime(time);
    }
}

export default new Util();
