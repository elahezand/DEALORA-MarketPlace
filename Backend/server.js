const app = require("./app")
const mongoose = require("mongoose")
const dotenv = require("dotenv")

const isProductionMode = process.env.NODE_ENV === "production"
if (!isProductionMode) {
    dotenv.config();
}
async function connectToDB() {
    try {
        await mongoose.connect(process.env.MONGO_URL)
        console.log(`MongoDB Connected: ${mongoose.connection.host}`)
    } catch (err) {
        console.log(`ERROR in mongoose connection: ${err}`)
        process.exit(1)
    }
}

async function startServer() {
    const port = process.env.PORT || 4000
    app.listen(port, () => {
        console.log(`Server Is Running ${isProductionMode ? "production" : "development"} mode On  ${port}`);
    })
}

async function run() {
    await connectToDB()
    await startServer()
}

run()