"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.isCordova = void 0;
const isCordova = () => typeof window !== 'undefined' &&
    ('PhoneGap' in window || 'Cordova' in window || 'cordova' in window);
exports.isCordova = isCordova;
//# sourceMappingURL=isCordova.js.map