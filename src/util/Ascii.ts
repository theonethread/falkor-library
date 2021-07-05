import figlet from "figlet";

import Theme from "./Theme.js";

export const enum ListType {
    PURE,
    BULLET,
    NUMERIC,
    MULTI_NUMERIC
}

export default class Ascii {
    public readonly bulletIndicator = "*";
    public readonly uncheckedSelectionIndicator = "[ ]";
    public readonly checkedSelectionIndicator = "[x]";

    constructor(protected theme: Theme) {}

    //#region LIST

    public list(list: string[], extra?: string[], type: ListType = ListType.PURE): string[] {
        const pad = list.length.toString().length;
        let content: string[];
        const maxLength = list.reduce((acc: number, curr: string) => Math.max(acc, curr.length), 0);
        if (extra) {
            const maxExtraLength = extra.reduce((acc: number, curr: string) => Math.max(acc, curr.length), 0);
            content = list.map(
                (curr: string, i: number) =>
                    `${this.itemPrefix(type, i, pad)}${curr.padEnd(maxLength, " ")}  ${this.theme.formatNotice(
                        extra[i].padEnd(maxExtraLength, " ")
                    )}`
            );
        } else {
            content = list.map(
                (curr: string, i: number) => `${this.itemPrefix(type, i, pad)}${curr.padEnd(maxLength, " ")}`
            );
        }
        return content;
    }

    //#endregion

    //#region FONT

    public font(text: string, options: figlet.Options | figlet.Fonts): string {
        if (typeof options === "string") {
            options = { font: options };
        }
        return figlet.textSync(text, options).trimEnd() + "\n";
    }

    //#endregion

    //#region HELPERS

    protected itemPrefix(type: ListType, index: number, pad: number): string {
        switch (type) {
            case ListType.BULLET:
                return this.theme.formatBullet(this.bulletIndicator) + " ";
            case ListType.NUMERIC:
                return this.theme.formatBullet((index + 1).toString().padStart(pad, " ")) + " ";
            case ListType.MULTI_NUMERIC:
                return this.theme.formatBullet("[ ] " + (index + 1).toString().padStart(pad, " ")) + " ";
        }
        return "";
    }

    //#endregion
}
