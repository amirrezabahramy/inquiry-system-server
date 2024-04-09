const express = require("express");
const mongoose = require("mongoose");
const { StatusCodes } = require("http-status-codes");
const { logger } = require("./src/middlewares/basic");

const app = express();

// Middlewares
app.use(
  require("cors")({
    origin: process.env.CORS_ORIGIN,
    credentials: true,
    allowedHeaders: ["Authorization", "Content-Type"],
    methods: ["GET", "POST", "PATCH", "DELETE", "OPTIONS"],
    optionsSuccessStatus: StatusCodes.OK,
  })
);
app.use(express.json());
app.use(logger);

// Routes
app.use("/api/v1", require("./src/routes"));

// Dotenv config
require("dotenv").config();

// DB Start
const { MONGODB_URI } = process.env;
mongoose.connect(MONGODB_URI).then(() => {
  console.log(`Connected to ${MONGODB_URI}.`);
});

// App start
const { APP_PORT, APP_HOSTNAME } = process.env;
app.listen(APP_PORT, APP_HOSTNAME, () => {
  console.log(
    `App is running on port: ${APP_PORT} and hostname: ${APP_HOSTNAME}.`
  );
});
