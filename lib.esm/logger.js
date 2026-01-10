let isEnabled = false;
// TODO: Replace this global state with an option for the Upload class
export function enableDebugLog() {
    isEnabled = true;
}
export function log(msg) {
    if (!isEnabled)
        return;
    console.log(msg);
}
//# sourceMappingURL=logger.js.map