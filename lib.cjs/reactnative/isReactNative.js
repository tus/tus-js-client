"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.isReactNativePlatform = isReactNativePlatform;
exports.isReactNativeFile = isReactNativeFile;
function isReactNativePlatform() {
    return (typeof navigator !== 'undefined' &&
        typeof navigator.product === 'string' &&
        navigator.product.toLowerCase() === 'reactnative');
}
function isReactNativeFile(input) {
    return (input != null && typeof input === 'object' && 'uri' in input && typeof input.uri === 'string');
}
//# sourceMappingURL=isReactNative.js.map