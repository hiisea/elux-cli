"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const http_1 = __importDefault(require("http"));
const cli_utils_1 = require("@elux/cli-utils");
const port = process.env.PORT;
const src = process.env.SRC;
const app = require(src);
const server = http_1.default.createServer(app);
app.set('port', port);
server.listen(port);
server.on('error', (error) => {
    if (error.syscall !== 'listen') {
        throw error;
    }
    const bind = typeof port === 'string' ? `Pipe ${port}` : `Port ${port}`;
    switch (error.code) {
        case 'EACCES':
            console.error(`${bind} requires elevated privileges`);
            process.exit(1);
        case 'EADDRINUSE':
            console.error(`${bind} is already in use`);
            process.exit(1);
        default:
            throw error;
    }
});
server.on('listening', () => {
    console.log(`\n.....${cli_utils_1.chalk.cyan('MockServer')} running at ${cli_utils_1.chalk.cyan.underline(`http://localhost:${port}/`)}`);
    console.log(`.....${cli_utils_1.chalk.cyan('MockServer')} running at ${cli_utils_1.chalk.cyan.underline(`http://${cli_utils_1.getLocalIP()}:${port}/`)}\n`);
});
['SIGINT', 'SIGTERM'].forEach((signal) => {
    process.on(signal, () => {
        process.exit(1);
    });
});
