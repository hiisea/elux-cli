"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getLocalIP = void 0;
const os_1 = require("os");
let localIP = '';
function getLocalIP() {
    if (!localIP) {
        localIP = 'localhost';
        const interfaces = os_1.networkInterfaces();
        for (const devName in interfaces) {
            const isEnd = interfaces[devName]?.some((item) => {
                if (item.family === 'IPv4' && item.address !== '127.0.0.1' && !item.internal) {
                    localIP = item.address;
                    return true;
                }
                return false;
            });
            if (isEnd) {
                break;
            }
        }
    }
    return localIP;
}
exports.getLocalIP = getLocalIP;
