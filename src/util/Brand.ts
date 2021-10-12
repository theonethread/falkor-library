import { TBrandConfig } from "../config/Config.js";
import { Ascii } from "./Ascii.js";
import { Quote } from "./Quote.js";

export class Brand {
    protected readonly brandTitle: string;
    protected readonly quote = new Quote();

    public get title(): string {
        return this.brandTitle;
    }

    constructor(config: TBrandConfig, protected ascii: Ascii, appName: string) {
        const y = new Date().getFullYear();
        appName = `Falkor ${appName}`;
        this.brandTitle = config.fancy
            ? `${this.ascii.font(appName, {
                  font: config.font
              })}\n©2020-${y} Barnabas Bucsy - ${
                  config.quote ? `${this.quote.getOne()}... - ` : ""
              }All rights reserved.`
            : `${appName} ©2020-${y} Barnabas Bucsy - All rights reserved.`;
    }
}
