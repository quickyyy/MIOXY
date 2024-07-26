class Logger {
    info(msg) {
        console.log(`\x1b[33m[Info]\x1b[0m ${msg}`);    
    }

    warning(msg) {
        console.log(`\x1b[33m[Warning]\x1b[0m ${msg}`)
    }

    client(msg) {
        console.log(`\x1b[33m[Client]\x1b[0m ${msg}`)
    }

    server(msg) {
        console.log(`\x1b[33m[Server]\x1b[0m ${msg}`)
    }

    error(msg) {
        console.log(`\x1b[31m[Error]\x1b[0m ${msg}`)
    }
}

module.exports = Logger;