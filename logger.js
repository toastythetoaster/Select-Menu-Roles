module.exports = class Logger {
    constructor(moduleName) {
        this.moduleName = moduleName.toUpperCase();
    }

    get timestamp() {
        let date = new Date();
        let fix = (num) => num < 10 ? `0${num}` : num;
        return `${fix(date.getHours())}:${fix(date.getMinutes())}:${fix(date.getSeconds())}`;
    }

    log(...args) {
        console.log(`[${this.timestamp}] [ INFO] [${this.moduleName}]`, ...args);
    }

    info(...args) {
        this.log(...args);
    }

    error(...args) {
        console.error(`[${this.timestamp}] [ERROR] [${this.moduleName}]`, ...args);
    }

    warn(...args) {
        console.warn(`[${this.timestamp}] [ WARN] [${this.moduleName}]`, ...args);
    }

    debug(...args) {
        console.debug(`[${this.timestamp}] [DEBUG] [${this.moduleName}]`, ...args);
    }
}
