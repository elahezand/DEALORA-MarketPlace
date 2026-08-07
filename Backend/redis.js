const redisDB = require("redis");
const redisClient = redisDB.createClient({
    socket: {
        host: '127.0.0.1',
        port: 6379
    },
});
redisClient.connect();
redisClient.on("connect", () => console.log("connecting to redis"));
redisClient.on("error", (error) => console.log(`can not connect to redis: ${error}`));
redisClient.on("ready", () => console.log("redis is connect and ready to use"));

module.exports = redisClient