const { createClient, createServer, states } = require("minecraft-protocol");
const fs = require("fs");
let userClient;
const packets = [];
let previousQueueNumber = null;
const configJson = fs.readFileSync("config.json", "utf-8");

// Parse the JSON string into a JavaScript object
const config = JSON.parse(configJson);
//const { username } = require("./username.json");


// 
// 
// 
// 
// 
// 

console.clear();
console.log("\x1b[34m███╗░░░███╗██╗░█████╗░██╗░░██╗██╗░░░██╗");
console.log("\x1b[34m████╗░████║██║██╔══██╗╚██╗██╔╝╚██╗░██╔╝      MinecraftProxyServer");
console.log("\x1b[34m██╔████╔██║██║██║░░██║░╚███╔╝░░╚████╔╝░      Original thread:");
console.log("\x1b[34m██║╚██╔╝██║██║██║░░██║░██╔██╗░░░╚██╔╝░░      Telegram: @bredcookie / @quickygod");
console.log("\x1b[34m██║░╚═╝░██║██║╚█████╔╝██╔╝╚██╗░░░██║░░░      Made with love ♡");
console.log("\x1b[34m╚═╝░░░░░╚═╝╚═╝░╚════╝░╚═╝░░╚═╝░░░╚═╝░░░");
console.info("\x1b[0m");

console.log("");
console.log(`\x1b[33m[Info]\x1b[0m Player username: \x1b[34m${config.accountname}\x1b[0m`);
console.log(`\x1b[33m[Info]\x1b[0m Server to connect: \x1b[34m${config.host}\x1b[0m`);
console.log("\x1b[33m[Client]\x1b[0m Creating client...");
const proxyClient = createClient({
  username: config.accountname,
  auth: "offline",
  host: config.host,
  port: config.ports,
  keepAlive: true,
  version: config.version,
  hideErrors: true,
});
console.log("\x1b[33m[Client]\x1b[0m Connected to server!");
proxyClient.on("packet", (data, meta) => {
  if (meta.name === "keep_alive") return;
  if (!["keep_alive", "success", "custom_payload", "encryption_begin", "compress", "look", "flying", "open_window", "close_window", "close_window", "player_chat", "profileless_chat"].includes(meta.name)) packets.push([meta, data]);
  if (!userClient || meta.state !== states.PLAY || userClient.state !== states.PLAY) return;
  userClient.write(meta.name, data);
  if (meta.name === "set_compression") userClient.compressionThreshold = data.threshold;
});

proxyClient.on("raw", (buffer, meta) => {
  if (!userClient || meta.name === "keep_alive" || meta.state !== states.PLAY || userClient.state !== states.PLAY) return;
});

proxyClient.on("end", () => {
  if (!userClient) return;
  userClient.end("\x1b[37mProxy client ended\x1b[0m");
});

proxyClient.on("error", (error) => {
  if (!userClient) return;
  console.error("\x1b[31m[Error]\x1b[0m Proxy client error:", error);
  userClient.end(error);
});
console.log(`\x1b[33m[Server]\x1b[0m Creating server...`);
const proxyServer = createServer({
  "online-mode": false,
  host: config.proxyhost,
  port: config.ports,
  keepAlive: false,
  version: config.version,
  motd: 'free proxies here'
});
console.log(`\x1b[33m[Server]\x1b[0m Server created!`);
console.log("\x1b[33m[Log]\x1b[0m \x1b[32mAll system working!\x1b[0m");
console.log("\x1b[33m[Log]\x1b[0m \x1b[32mWaiting for connections!\x1b[0m");
console.log(`\x1b[33m[Log]\x1b[0m \x1b[32mConnect to ${config.proxyhost}:${config.ports}\x1b[0m`);
proxyServer.on("login", (client) => {
  console.log(`\x1b[34m[Client]\x1b[0m ${client.username} has connected`);

  packets.forEach((p) => {
    const meta = p[0];
    const data = p[1];
    client.write(meta.name, data);
  });

  userClient = client;

  client.on("packet", (data, meta) => {
    if (meta.name === "keep_alive") return;
    if (!proxyClient || meta.state !== states.PLAY || proxyClient.state !== states.PLAY) return;
    proxyClient.write(meta.name, data);
  });

  client.on("raw", (buffer, meta) => {
    if (meta.name === "keep_alive") return;
    if (!proxyClient || meta.state !== states.PLAY || proxyClient.state !== states.PLAY) return;
  });

  client.on("end", () => {
    if (!proxyClient) return;
    console.log(`\x1b[34m[Client]\x1b[0m ${client.username} has disconnected`);
  });

  client.on("error", (error) => {
    if (!proxyClient) return;
    console.error(error);
  });
});