export class Quote {
    protected readonly list = [
        "Genius doesn't work on an assembly line basis",
        "To boldly go where no man has gone before",
        "A little suffering is good for the soul",
        "Conquest is easy. Control is not",
        "Hang on tight and survive. Everybody does",
        "Galloping around the cosmos is a game for the young",
        "Logic is the beginning of wisdom, not the end",
        "A library serves no purpose unless someone is using it",
        "If we're going to be damned, let's be damned for what we really are",
        "Insufficient facts always invite danger",
        "Leave bigotry in your quarters; there's no room for it on the bridge",
        "In critical moments, men sometimes see exactly what they wish to see",
        "Change is the essential process of all existence"
    ];

    public getOne(): string {
        return this.list[Math.floor(Math.random() * this.list.length)];
    }
}
