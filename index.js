import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import MongoConnection from "./src/config/config.js";
import appRouter from "./src/routes/index.js";

import "dotenv/config";
const app = express();

dotenv.config();
const PORT = process.env.PORT || 8000;

MongoConnection();
// app.use(express.static("client"));

// Configure CORS
const corsOptions = {
  origin: true, // Allow all origins
  methods: "GET,HEAD,PUT,PATCH,POST,DELETE",
  optionsSuccessStatus: 200, // Some legacy browsers choke on 204
  credentials: true,
};

app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cors(corsOptions));
// Handle preflight requests
app.options("*", cors());
app.use(appRouter);
app.get("/", (req, res) => {
  res.send("this is the app home page");
});

app.listen(PORT, () => {
  console.log(`Node server listening at port: ${PORT}`);
});
