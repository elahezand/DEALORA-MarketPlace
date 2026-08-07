const express = require("express");
const cookieParser = require("cookie-parser");
const cors = require("cors");
const path = require("path");
const helmet = require("helmet");

const errorHandler = require("./middlewares/errorHandler");
const { redirectToProduct } = require("./controllers/shortLink");

const authRouter = require("./routes/auth");
const storeRouter = require("./routes/store");
const locationsRouter = require("./routes/locations");
const userRouter = require("./routes/user");
const categoryRouter = require("./routes/category");
const commentRouter = require("./routes/comment");
const contactRouter = require("./routes/contact");
const infoRouter = require("./routes/info");
const newsletterRouter = require("./routes/newsletter");
const noteRouter = require("./routes/note");
const notificationRouter = require("./routes/notification");
const offerSellerRouter = require("./routes/offerSeller");
const listingRouter = require("./routes/listing");
const cartRouter = require("./routes/cart");
const orderRouter = require("./routes/order");
const couponRouter = require("./routes/coupon");
const favoriteRouter = require("./routes/wishList");
const adminStatsRouter = require("./routes/AdminStats");
const reportRouter = require("./routes/report");
const chatRouter = require("./routes/chat");
const withdrawalRouter = require("./routes/withdrawal");

const app = express();

const allowedOrigins =
  process.env.ALLOWED_ORIGINS?.split(",").map((origin) => origin.trim()) || [
    "http://localhost:5173",
    "http://localhost:3000",
  ];

app.use(
  helmet({
    crossOriginResourcePolicy: false,
  })
);

app.use(
  cors({
    origin(origin, callback) {
      if (!origin || allowedOrigins.includes(origin)) {
        return callback(null, true);
      }

      return callback(new Error("Not allowed by CORS"));
    },
    credentials: true,
  })
);

app.use(cookieParser());
app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: false, limit: "1mb" }));

// Log all incoming requests
app.use((req, res, next) => {
  console.log(`${req.method} ${req.originalUrl}`);
  next();
});

app.use(
  "/public",
  express.static(path.join(__dirname, "public"), {
    index: false,
    maxAge: "1d",
  })
);

app.use(
  "/users/avatars",
  express.static(path.join(__dirname, "public", "users", "avatars"), {
    index: false,
    maxAge: "1d",
  })
);

app.use(
  "/articles/images",
  express.static(path.join(__dirname, "public", "articles", "images"), {
    index: false,
    maxAge: "1d",
  })
);

const routes = [
  ["/auth", authRouter],
  ["/stores", storeRouter],
  ["/locations", locationsRouter],
  ["/users", userRouter],
  ["/categories", categoryRouter],
  ["/listings", listingRouter],
  ["/comments", commentRouter],
  ["/contacts", contactRouter],
  ["/infos", infoRouter],
  ["/notes", noteRouter],
  ["/newsletters", newsletterRouter],
  ["/notifications", notificationRouter],
  ["/offers", offerSellerRouter],
  ["/cart", cartRouter],
  ["/orders", orderRouter],
  ["/coupon", couponRouter],
  ["/wishList", favoriteRouter],
  ["/admin/stats", adminStatsRouter],
  ["/reports", reportRouter],
  ["/chat", chatRouter],
  ["/withdrawals", withdrawalRouter],
];

routes.forEach(([routePath, router]) => {
  if (!router) {
    console.error(`Router not found for ${routePath}`);
    return;
  }

  console.log(`Loaded route: /api${routePath}`);
  app.use(`/api${routePath}`, router);
});

app.get("/p/:shortIdentifier", redirectToProduct);

// 404 handler
app.use((req, res, next) => {
  console.error(`404 -> ${req.method} ${req.originalUrl}`);

  const error = new Error("Route not found");
  error.statusCode = 404;
  next(error);
});

app.use(errorHandler);

module.exports = app;