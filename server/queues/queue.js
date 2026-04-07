const { Queue } = require("bullmq");

const queue = new Queue("postQueue", {
  connection: {
    host: "127.0.0.1",
    port: 6379
  }
});

module.exports = queue;