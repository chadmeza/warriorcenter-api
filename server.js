const app = require('./app');
const http = require('http');

/**
 * When we receive the port from an environment variable
 * and/or when we set the port,
 * ensure that it is a valid number.
 */ 
const normalizePort = (val) => {
    var port = parseInt(val, 10);

    if (isNaN(port)) {
        return val;
    }

    if (port >= 0) {
        return port;
    }

    return false;
};

// Error handler which will exit Node gracefully
const onError = (error) => {
    if (error.syscall !== 'listen') {
        throw error;
    }

    const bind = typeof addr === 'string' ? 'pipe ' + addr : 'port ' + port;

    switch (error.code) {
        case 'EACCES':
            console.error(bind + ' requires elevated privileges');
            process.exit(1);
            break;
        case 'EADDRINUSE':
            console.error(bind + ' is already in use');
            process.exit(1);
            break;
        default:
            throw error;
    }
};

// Write to the console when this starts listening to incoming requests
const onListening = () => {
    const addr = server.address();
    const bind = typeof addr === 'string' ? 'pipe ' + addr : 'port ' + port;
    console.log('Listening on ' + bind);
};

const port = normalizePort(process.env.PORT || '3000');
app.set('port', port);

const server = http.createServer(app);

// Registered listeners
server.on('error', onError);
server.on('listening', onListening);

// Start server
server.listen(port);

process.on('unhandledRejection', (err, promise) => {
    server.close(() => process.exit(1));
});

module.exports = server;