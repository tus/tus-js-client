"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.fingerprint = fingerprint;
const node_crypto_1 = require("node:crypto");
const node_fs_1 = require("node:fs");
const promises_1 = require("node:fs/promises");
const path = __importStar(require("node:path"));
async function fingerprint(file, options) {
    if (Buffer.isBuffer(file)) {
        // create MD5 hash for buffer type
        const blockSize = 64 * 1024; // 64kb
        const content = file.slice(0, Math.min(blockSize, file.length));
        const hash = (0, node_crypto_1.createHash)('md5').update(content).digest('hex');
        const ret = ['node-buffer', hash, file.length, options.endpoint].join('-');
        return ret;
    }
    if (file instanceof node_fs_1.ReadStream && file.path != null) {
        const name = path.resolve(Buffer.isBuffer(file.path) ? file.path.toString('utf-8') : file.path);
        const info = await (0, promises_1.stat)(file.path);
        const ret = ['node-file', name, info.size, info.mtime.getTime(), options.endpoint].join('-');
        return ret;
    }
    // fingerprint cannot be computed for file input type
    return null;
}
//# sourceMappingURL=fileSignature.js.map