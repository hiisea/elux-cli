/* eslint-disable no-fallthrough */
import http from 'http';
import type * as Utils from '@elux/cli-utils';

const {
  chalk,
  getLocalIP,
}: {
  chalk: typeof Utils.chalk;
  getLocalIP: typeof Utils.getLocalIP;
} = require(process.env.ELUX_UTILS!);

const port = process.env.PORT;
const src = process.env.SRC;
const app = require(src!);
const server = http.createServer(app);
app.set('port', port);
server.listen(port);
server.on('error', (error: any) => {
  if (error.syscall !== 'listen') {
    throw error;
  }
  const bind = typeof port === 'string' ? `Pipe ${port}` : `Port ${port}`;
  // handle specific listen errors with friendly messages
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
  console.log(`\n.....${chalk.cyan('MockServer')} running at ${chalk.cyan.underline(`http://localhost:${port}/`)}`);
  console.log(`.....${chalk.cyan('MockServer')} running at ${chalk.cyan.underline(`http://${getLocalIP()}:${port}/`)}\n`);
});
['SIGINT', 'SIGTERM'].forEach((signal) => {
  process.on(signal, () => {
    process.exit(1);
  });
});
