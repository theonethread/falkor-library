class Util {
    public deepFreeze(object: any): void {
        for (const name of Object.getOwnPropertyNames(object)) {
            const value = object[name];
            if (value && typeof value === "object") {
                this.deepFreeze(value);
            }
        }
        Object.freeze(object);
    }
}

export default new Util();
