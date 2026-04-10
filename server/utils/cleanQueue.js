const queue = require("../queues/queue");

const cleanQueue = async () => {
  try {
    console.log("🧹 Cleaning queue...");

    await queue.drain(); // waiting jobs remove
    await queue.clean(0, 1000, "delayed");
    await queue.clean(0, 1000, "wait");
    await queue.clean(0, 1000, "active");
    await queue.clean(0, 1000, "failed");
    await queue.clean(0, 1000, "completed");

    console.log("✅ Queue cleaned successfully");

    process.exit(0);
  } catch (err) {
    console.log("❌ Queue clean error:", err);
    process.exit(1);
  }
};

cleanQueue();