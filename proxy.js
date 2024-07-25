
const { createClient, createServer, states } = require("minecraft-protocol");
const fs = require("fs");
const path = "config.json";
const Logger = require('./logger');
const logger = new Logger();

if (!fs.existsSync(path)) {
    logger.warning("Configuration file not found. Creating a new one with default values.");

    const defaultConfig = {
        accountname: "Steve",
        host: "localhost",
        proxyhost: "localhost",
        ports: 25565,
        version: "1.16.5"
    };

    fs.writeFileSync(path, JSON.stringify(defaultConfig, null, 2), "utf-8");
    logger.info("Please fill in the required values in 'config.json' and restart mioxy.");
    process.exit(1);
}

const config = JSON.parse(fs.readFileSync(path, "utf-8"));

let userClient;
const packets = [];

console.clear();

const banner = `
\x1b[34m███╗░░░███╗██╗░█████╗░██╗░░██╗██╗░░░██╗
████╗░████║██║██╔══██╗╚██╗██╔╝╚██╗░██╔╝      MinecraftProxyServer
██╔████╔██║██║██║░░██║░╚███╔╝░░╚████╔╝░      Original thread: https://yougame.biz/threads/304120/
██║╚██╔╝██║██║██║░░██║░██╔██╗░░░╚██╔╝░░      Telegram: @bredcookie
██║░╚═╝░██║██║╚█████╔╝██╔╝╚██╗░░░██║░░░      Made with love ♡
╚═╝░░░░░╚═╝╚═╝░╚════╝░╚═╝░░╚═╝░░░╚═╝░░░      Remake by dest4590
\x1b[0m
`;
console.log(banner);
logger.info(`Player username: \x1b[36m${config.accountname}\x1b[0m`);
logger.info(`Server to connect: \x1b[36m${config.host}\x1b[0m`);
logger.client("Creating client...");

// Создание клиента
const proxyClient = createClient({
    username: config.accountname,
    auth: "offline",
    host: config.host,
    port: config.ports,
    keepAlive: true,
    version: config.version,
    hideErrors: true,
});

proxyClient.on("packet", (data, meta) => {
    if (["keep_alive", "success", "custom_payload", "encryption_begin", "compress", "look", "flying", "open_window", "close_window", "player_chat", "profileless_chat"].includes(meta.name)) return;
    packets.push([meta, data]);

    if (userClient && meta.state === states.PLAY && userClient.state === states.PLAY) {
        userClient.write(meta.name, data);
        if (meta.name === "set_compression") userClient.compressionThreshold = data.threshold;
    }
});

proxyClient.on("raw", (buffer, meta) => {
    if (userClient && meta.state === states.PLAY && userClient.state === states.PLAY) return;
});

proxyClient.on("end", () => {
    if (userClient) logger.info("\x1b[37mProxy client ended\x1b[0m");
});

proxyClient.on("error", (error) => {
    if (userClient) {
        logger.error(`Proxy client error: ${error}`);
        userClient.end(error);
    }
});

logger.server("Creating server...");

const proxyServer = createServer({
    "online-mode": false,
    host: config.proxyhost,
    port: config.ports,
    keepAlive: false,
    version: config.version,
    motd: 'free proxies here'
});

logger.server("Server created!");
logger.info("All system working!");
logger.info("Waiting for connections!");
logger.info(`Connect to \x1b[36m${config.proxyhost}:${config.ports}\x1b[0m`);

proxyServer.on("login", (client) => {
    logger.client(`${client.username} has connected`);

    packets.forEach(([meta, data]) => client.write(meta.name, data));
    userClient = client;

    client.on("packet", (data, meta) => {
        if (!["keep_alive"].includes(meta.name) && proxyClient && meta.state === states.PLAY && proxyClient.state === states.PLAY) {
            proxyClient.write(meta.name, data);
        }
    });

    client.on("raw", (buffer, meta) => {
        if (!["keep_alive"].includes(meta.name) && proxyClient && meta.state === states.PLAY && proxyClient.state === states.PLAY) return;
    });

    client.on("end", () => {
        if (proxyClient) logger.client(`${client.username} has disconnected`);
    });

    client.on("error", (error) => {
        if (proxyClient) console.error(error);
    });
});
