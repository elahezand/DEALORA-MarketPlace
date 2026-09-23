const app = require("./app")
const mongoose = require("mongoose")
const dotenv = require("dotenv")
const logger = require("./utils/logger")

const isProductionMode = process.env.NODE_ENV === "production"
if (!isProductionMode) {
    dotenv.config();
}
async function connectToDB() {
    try {
        await mongoose.connect(process.env.MONGO_URI)
        logger.info(`MongoDB Connected: ${mongoose.connection.host}`)
    } catch (err) {
        logger.error(`ERROR in mongoose connection: ${err}`)
        process.exit(1)
    }
}

async function startServer() {
    const port = process.env.PORT || 4000
    app.listen(port, () => {
        logger.info(`Server Is Running ${isProductionMode ? "production" : "development"} mode On  ${port}`);
    })
}


function startOrderSweeper() {
    const { runOrderSweeps } = require("./services/shared/orderSweeper");
    const everyMinutes = Number(process.env.ORDER_SWEEP_MINUTES || 10);

    const run = async () => {
        try {
            const result = await runOrderSweeps();
            const total = result.finished + result.paid + result.cancelled + result.completed;
            if (total) logger.info(`order sweeper: ${JSON.stringify(result)}`);
        } catch (err) {
            logger.error(`order sweeper failed: ${err}`);
        }
    };

    run();
    setInterval(run, everyMinutes * 60 * 1000).unref();
}

async function run() {
    await connectToDB()
    await startServer()
    startOrderSweeper()
}

run()
