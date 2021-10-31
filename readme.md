# **Falkor Operations Library**

[![Npm Keywords](https://img.shields.io/github/package-json/keywords/theonethread/falkor-library "Keywords")](https://www.npmjs.com/package/@falkor/falkor-library "Visit") &nbsp;
[![Npm Package](https://img.shields.io/npm/v/@falkor/falkor-library "Npm")](https://www.npmjs.com/package/@falkor/falkor-library "Visit") &nbsp;
[![Node Version](https://img.shields.io/node/v/@falkor/falkor-library "Node")](https://nodejs.org/ "Visit") &nbsp;
[![Build](https://img.shields.io/github/workflow/status/theonethread/falkor-library/Falkor%20CI%20-%20Release "Build")](https://github.com/theonethread/falkor-library/actions "Visit") &nbsp;
[![Security](https://img.shields.io/github/workflow/status/theonethread/falkor-library/Falkor%20CI%20-%20Security?label=security "Security")](https://github.com/theonethread/falkor-library/actions "Visit") &nbsp;
[![Activity](https://img.shields.io/github/last-commit/theonethread/falkor-library "Activity")](https://github.com/theonethread/falkor-library "Visit") &nbsp;
[![Falkor Bundler](https://img.shields.io/npm/dependency-version/@falkor/falkor-library/dev/@falkor/falkor-bundler "Falkor Bundler")](https://www.npmjs.com/package/@falkor/falkor-bundler "Visit") &nbsp;
[![Typedoc](https://img.shields.io/npm/dependency-version/@falkor/falkor-library/dev/typedoc "Typedoc")](https://www.npmjs.com/package/typedoc "Visit") &nbsp;
[![Type Definitions](https://img.shields.io/npm/types/@falkor/falkor-library "Typings")](https://www.typescriptlang.org/ "Visit") &nbsp;
[![Snyk Vulnerabilities](https://img.shields.io/snyk/vulnerabilities/github/theonethread/falkor-library "Snyk")](https://snyk.io/test/github/theonethread/falkor-library "Visit") &nbsp;
[![License](https://img.shields.io/npm/l/@falkor/falkor-library "MIT")](https://github.com/theonethread/falkor-library/blob/master/license.txt "Visit")

```javascript
// Work In Progress
```

The `falkor-library` project is a collection of devops terminal tools written in strict ES6 TypeScript to be used with the **Falkor Framework**.

## **Usage**

See the following projects consuming `falkor-library`:

* [`@falkor/falkor-commander`](https://www.npmjs.com/package/@falkor/falkor-commander "Visit")
* [`falkor-plugin-example`](https://github.com/theonethread/falkor-plugin-example "Visit")

## **Further Development**

The project uses the [`@falkor/falkor-bundler`](https://www.npmjs.com/package/@falkor/falkor-bundler "Visit") module to compile sources. One can use the commands in the root directory:

```
$ npm install
$ npm run [ debug | release ]
```

> _**SEE**: `"scripts"` entry in [`package.json`](https://github.com/theonethread/falkor-library/blob/master/package.json "Open")_

### **Documentation**

To generate HTML documentation from the TypeScript sources under the ignored `.doc` directory using [Typedoc](https://typedoc.org "Visit") run:

```
$ npm run doc
```

Or one can visit the exported [online documentation](https://theonethread.github.io/falkor-library-doc "Visit").

### **Versioning and Branching Strategy**

Release sources can be found on the `master` branch, this one always points to the latest tagged release. Previous sources of releases' can be found using Git version tags (or browsing GitHub releases). Released packages can be found on [npmjs](https://www.npmjs.com/package/@falkor/falkor-auth-server "Visit").

The repository's main branch is `develop` (due to technical reasons), this holds all developments that are already decided to be included in the next release. Usually this branch is ahead of master one patch version (but based on upcoming features to include this can become minor, or major), so prepared external links may yet be broken.

The `feature/*` branches usually hold ideas and POC code, these will only be merged into `develop` once their impact measured and quality meets release requirements.

> _The project uses [SemVer](https://semver.org "Visit"), Git tags are prefixed with a `v` character._

### **GitHub Actions**

The workflows can be found [here](https://github.com/theonethread/falkor-library/blob/develop/.github/workflows "Open").

#### **Continuous Integration**

Automatic builds are achieved via GitHub actions, CI will make nightly builds of the `develop` branch (using Ubuntu image), and test `master` when there is a pull request, or commit on it (using Ubuntu - Win - MacOS image matrix).

#### **API Documentation**

There is also a manually triggered workflow, that deploys generated documentation to [GitHub Pages](https://theonethread.github.io/falkor-library-doc "Visit").

#### **Security**

The project uses [CodeQL](https://codeql.github.com "Visit") and [Snyk](https://snyk.io "Visit") to ensure standard security.

> _The **Falkor Framework** supports a healthy and ubiquitous Internet Immune System enabled by security research, reporting, and disclosure. Check out our [Vulnerability Disclosure Policy](https://github.com/theonethread/falkor-library/security/policy "Open") - based on [disclose.io](https://disclose.io "Visit")'s best practices._

### **Open Source**

The latest sources can always be found on [GitHub](https://github.com/theonethread/falkor-library "Visit").

### **License**

[MIT](https://github.com/theonethread/falkor-library/blob/master/license.txt "Open")

_©2020-2021 Barnabas Bucsy - All rights reserved._
