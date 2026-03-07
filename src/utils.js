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
exports.SUPPORTED_IMAGE_EXTENSIONS = void 0;
exports.formatBytes = formatBytes;
exports.isSupportedImageFile = isSupportedImageFile;
exports.toPosixPath = toPosixPath;
exports.createIssueId = createIssueId;
exports.estimateSavingsPct = estimateSavingsPct;
exports.clamp = clamp;
exports.escapeRegExp = escapeRegExp;
const path = __importStar(require("path"));
exports.SUPPORTED_IMAGE_EXTENSIONS = ['.png', '.jpg', '.jpeg', '.gif', '.svg', '.webp', '.avif'];
function formatBytes(bytes) {
    if (bytes < 1024) {
        return `${bytes} B`;
    }
    if (bytes < 1024 * 1024) {
        return `${(bytes / 1024).toFixed(1)} KB`;
    }
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}
function isSupportedImageFile(filePath) {
    return exports.SUPPORTED_IMAGE_EXTENSIONS.includes(path.extname(filePath).toLowerCase());
}
function toPosixPath(value) {
    return value.split(path.sep).join('/');
}
function createIssueId(relativePath) {
    return `imagelint:${toPosixPath(relativePath)}`;
}
function estimateSavingsPct(originalBytes, estimatedBytes) {
    if (originalBytes <= 0) {
        return 0;
    }
    return Math.max(0, Math.round(((originalBytes - estimatedBytes) / originalBytes) * 100));
}
function clamp(value, min, max) {
    return Math.min(max, Math.max(min, value));
}
function escapeRegExp(value) {
    return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
//# sourceMappingURL=utils.js.map