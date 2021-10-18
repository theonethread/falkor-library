# **Falkor Operations Library**

[![Npm Keywords](https://img.shields.io/github/package-json/keywords/theonethread/falkor-library "Keywords")](https://www.npmjs.com/package/@falkor/falkor-library "Visit") &nbsp;
[![Npm Package](https://img.shields.io/npm/v/@falkor/falkor-library "Npm")](https://www.npmjs.com/package/@falkor/falkor-library "Visit") &nbsp;
[![Node Version](https://img.shields.io/node/v/@falkor/falkor-library "Node")](https://nodejs.org/ "Visit") &nbsp;
[![Activity](https://img.shields.io/github/last-commit/theonethread/falkor-library "Activity")](https://github.com/theonethread/falkor-library "Visit") &nbsp;
[![Falkor Bundler](https://img.shields.io/npm/dependency-version/@falkor/falkor-library/dev/@falkor/falkor-bundler "Falkor Bundler")](https://www.npmjs.com/package/@falkor/falkor-bundler "Visit") &nbsp;
[![Type Definitions](https://img.shields.io/npm/types/@falkor/falkor-library "Typings")](https://www.typescriptlang.org/ "Visit")
[![Snyk Vulnerabilities](https://img.shields.io/snyk/vulnerabilities/github/theonethread/falkor-library "Snyk")](https://snyk.io/test/github/theonethread/falkor-library "Visit") &nbsp;
[![License](https://img.shields.io/npm/l/@falkor/falkor-library "MIT")](https://github.com/theonethread/falkor-library/blob/master/license.txt "Visit")

```javascript
// Work In Progress
```

The `falkor-library` project is a collection of DevOps tools written in strict ES6 TypeScript to be used with the **Falkor Framework**.

## **Usage**

```typescript
import falkor from "@falkor/falkor-library";

// extend Task
class ExampleTask extends falkor.Task {
    constructor() {
        super(
            // name of the current sequence batch
            "Task Example",
            // *optional* global command-line dependencies
            {
                // lazy shorthand syntax
                git: "2.30.1",
                // below dependency object is the equivalent of "11.0.1" (lazy shorthand syntax string, like above)
                // this is *exactly* how the library unfolds shorthand dependencies
                // @see TaskRunner::mergeDependencies
                "clang++": {
                    command: "clang++ --version",
                    minVersion: "11.0.1",
                    versionMatch: /version\s*([^\s]+)/
                }
            }
        );
    }

    // necessary implementation of abstract async function (entry point)
    public async run(): Promise<void> {
        // asynchronous command-line execution
        // (command output is handled by library)
        const fetchResult = await this.exec("git fetch --all --tags" /*+ " --recurse-submodules" /**/, {
            // current working directory for command
            cwd: "../falkor-library"
        });
        // the library does not throw errors (apart in setup stage), once running it only reports failure(s)
        if (!fetchResult.success) {
            // built in method, that *throws* library acceptable error
            // (reducing state to PANIC, allowing task level clean-up, then exiting with non-zero exit code)
            this.error("failed fetch");
        }

        const commitResult = await this.exec("git commit", {
            cwd: "../falkor-library",
            // exceptions are silenced, when output is tested positive for any of these *optional* regular expressions
            noError: [/nothing to commit, working tree clean/]
        });
        if (!commitResult.success) {
            this.error("failed commit");
        }

        // request input from the user
        const answer1 = await this.ask(
            // the text of the "question" is necessary
            "try selection:",
            {
                // if answers are provided, the input will be tested against them
                answers: ["node", "python", "erlang", "go", "php", "lisp", "fortran"],
                // forces answer items to be displayed line-by-line
                // (this also makes them selectable by answer number, or interactively)
                list: true
            }
        );
        if (answer1 === null) {
            // currently this can only happen after predefined number of wrong answers, or after timeout
            this.error("failed input");
        }

        // allows multiple selection (separated by commas, or by interactive input)
        const answer2 = await this.ask("try multi-selection:", {
            // if answers are provided, the input will be tested against them
            answers: ["node", "python", "erlang", "go", "php", "lisp", "fortran"],
            // forces answer items to be displayed line-by-line
            // (this also makes them selectable by answer number-, or interactively)
            list: true,
            // if answers are provided, this will allow multiple selection
            // (with- or without list mode)
            multi: true
        });
        if (answer2 === null) {
            this.error("failed input");
        }

        // the logger instance is used to display formatted data throughout the batch
        this.logger
            // new prompt for all further logs, newlines in logs will be indented with same length whitespace
            .pushPrompt("[NIRVANA]")
            // level of output is based on configuration, one can use:
            // debug(), notice(), info(), warning(), error(), fatal()
            // @see LogLevel
            .info("luv' this band")
            // prompts also support internal ansi color sequence(s) - if underlying terminal does too
            .pushPrompt(this.theme.formatTrace("nevermind"))
            // (level of output can be overridden in the '.ops.json' file in project root)
            // @see LogLevel
            .info(
                // inline styling of log chunks is always done through the theme
                this.theme.formatSuccess(
                    // ascii is a new addition, currently it creates lists, and ascii figlet fonts
                    // (newlines are padded correctly by library, extra one added to the end for readability)
                    this.ascii.font("I'm done", "Big")
                )
            )
            // discard the last two demonstrational prompts
            .popPrompt(2);
    }
}
```

## **Further Development**

The project uses the [`@falkor/falkor-bundler`](https://www.npmjs.com/package/@falkor/falkor-bundler "Visit") module to compile sources. You can run:

```
$ npm run [ debug | release ]
```

> _**SEE**: `"scripts"` entry in [`package.json`](https://github.com/theonethread/falkor-library/blob/master/package.json "Open")_

### **Documentation**

To generate HTML documentation from the TypeScript sources under the ignored `.doc` directory using [Typedoc](https://typedoc.org "Visit") run:

```
$ npm run doc
```

### **TODO**

* Extend error handling with signals:
    * Recognize need of recovery on `SIGINT`
* Run failure log based recovery at startup, rather than secure graceful shutdown on error / signal
    * Fewer plugins to load in `recovery` mode, if explicitly requested

### **Version History**

* `development`
    * [GitHub](https://github.com/theonethread/falkor-library "Visit")
* `1.0.0-beta.2`
    * [npmjs](https://www.npmjs.com/package/@falkor/falkor-library/v/1.0.0-beta.2 "Visit")
    * [GitHub](https://github.com/theonethread/falkor-library/releases/tag/v1.0.0-beta.2 "Visit")
* `1.0.0-beta.1`
    * [npmjs](https://www.npmjs.com/package/@falkor/falkor-library/v/1.0.0-beta.1 "Visit")
    * [GitHub](https://github.com/theonethread/falkor-library/releases/tag/v1.0.0-beta.1 "Visit")
* `1.0.0-beta.0`
    * [npmjs](https://www.npmjs.com/package/@falkor/falkor-library/v/1.0.0-beta.0 "Visit")
    * [GitHub](https://github.com/theonethread/falkor-library/releases/tag/v1.0.0-beta.0 "Visit")

### **Open Source**

You can always find the latest sources on [GitHub](https://github.com/theonethread/falkor-library "Visit").

### **License**

[MIT](https://github.com/theonethread/falkor-library/blob/master/license.txt "Open")

_©2020-2021 Barnabas Bucsy - All rights reserved._
