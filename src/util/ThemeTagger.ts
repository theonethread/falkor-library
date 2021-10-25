import Theme from "../util/Theme.js";

export default class ThemeTagger {
    constructor(private theme: Theme) {}

    //#region BRAND

    /** Template literal tag for 'Theme::formatBrand' */
    public brd(strArr: TemplateStringsArray, ...expr: string[]): string {
        return this.formatExpression(this.theme.formatBrand, strArr, expr);
    }

    //#endregion

    //#region SEVERITY

    /** Template literal tag for 'Theme::formatDebug' */
    public dbg(strArr: TemplateStringsArray, ...expr: string[]): string {
        return this.formatExpression(this.theme.formatDebug, strArr, expr);
    }

    /** Template literal tag for 'Theme::formatNotice' */
    public ntc(strArr: TemplateStringsArray, ...expr: string[]): string {
        return this.formatExpression(this.theme.formatNotice, strArr, expr);
    }

    /** Template literal tag for 'Theme::formatInfo' */
    public inf(strArr: TemplateStringsArray, ...expr: string[]): string {
        return this.formatExpression(this.theme.formatInfo, strArr, expr);
    }

    /** Template literal tag for 'Theme::formatWarning' */
    public wrn(strArr: TemplateStringsArray, ...expr: string[]): string {
        return this.formatExpression(this.theme.formatWarning, strArr, expr);
    }

    /** Template literal tag for 'Theme::formatError' */
    public err(strArr: TemplateStringsArray, ...expr: string[]): string {
        return this.formatExpression(this.theme.formatError, strArr, expr);
    }

    /** Template literal tag for 'Theme::formatFatal' */
    public ftl(strArr: TemplateStringsArray, ...expr: string[]): string {
        return this.formatExpression(this.theme.formatFatal, strArr, expr);
    }

    //#endregion

    //#region INLINE

    /** Template literal tag for 'Theme::formatTrace' */
    public trc(strArr: TemplateStringsArray, ...expr: string[]): string {
        return this.formatExpression(this.theme.formatTrace, strArr, expr);
    }

    /** Template literal tag for 'Theme::formatPath' */
    public pth(strArr: TemplateStringsArray, ...expr: string[]): string {
        return this.formatExpression(this.theme.formatPath, strArr, expr);
    }

    /** Template literal tag for 'Theme::formatCommand' */
    public cmd(strArr: TemplateStringsArray, ...expr: string[]): string {
        return this.formatExpression(this.theme.formatCommand, strArr, expr);
    }

    /** Template literal tag for 'Theme::formatBullet' */
    public blt(strArr: TemplateStringsArray, ...expr: string[]): string {
        return this.formatExpression(this.theme.formatBullet, strArr, expr);
    }

    //#endregion

    //#region INTERACTION

    /** Template literal tag for 'Theme::formatQuestion' */
    public qst(strArr: TemplateStringsArray, ...expr: string[]): string {
        return this.formatExpression(this.theme.formatQuestion, strArr, expr);
    }

    /** Template literal tag for 'Theme::formatSelection' */
    public sel(strArr: TemplateStringsArray, ...expr: string[]): string {
        return this.formatExpression(this.theme.formatSelection, strArr, expr);
    }

    //#endregion

    //#region TASK

    /** Template literal tag for 'Theme::formatTask' */
    public tsk(strArr: TemplateStringsArray, ...expr: string[]): string {
        return this.formatExpression(this.theme.formatTask, strArr, expr);
    }

    /** Template literal tag for 'Theme::formatSuccess' */
    public scs(strArr: TemplateStringsArray, ...expr: string[]): string {
        return this.formatExpression(this.theme.formatSuccess, strArr, expr);
    }

    /** Template literal tag for 'Theme::formatFailure' */
    public flr(strArr: TemplateStringsArray, ...expr: string[]): string {
        return this.formatExpression(this.theme.formatFailure, strArr, expr);
    }

    //#endregion

    //#region HELPERS

    protected formatExpression(func: (str: string) => string, strArr: TemplateStringsArray, expr: string[]): string {
        return strArr.map((s, i) => func.call(this.theme, s + (expr[i] || ""))).join("");
    }

    //#endregion
}
