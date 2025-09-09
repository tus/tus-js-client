"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.enableDebugLog = enableDebugLog;
exports.log = log;
let isEnabled = false;
// TODO: Replace this global state with an option for the Upload class
function enableDebugLog() {
    isEnabled = true;
}
function log(msg) {
    if (!isEnabled)
        return;
    console.log(msg);
}
//# sourceMappingURL=logger.js.map