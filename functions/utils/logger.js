"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.logger = void 0;
class cLogger {
    constructor() { }
    info(data) {
        console.log(data);
    }
    error(data) {
        console.error(data);
    }
    child(options) {
        return new ChildLogger(this, options.requestId);
    }
}
class ChildLogger {
    constructor(parent, requestId) {
        this.parent = parent;
        this.requestId = requestId;
    }
    info(data) {
        this.parent.info(`[${this.requestId}]: ${data}`);
    }
    error(data) {
        this.parent.error(`[${this.requestId}]: ${data}`);
    }
    // Método para crear un child logger anidado
    child(options) {
        return new ChildLogger(this.parent, `${this.requestId}:${options.requestId}`);
    }
}
exports.logger = new cLogger();
