export function isReactNativePlatform() {
    return (typeof navigator !== 'undefined' &&
        typeof navigator.product === 'string' &&
        navigator.product.toLowerCase() === 'reactnative');
}
export function isReactNativeFile(input) {
    return (input != null && typeof input === 'object' && 'uri' in input && typeof input.uri === 'string');
}
//# sourceMappingURL=isReactNative.js.map