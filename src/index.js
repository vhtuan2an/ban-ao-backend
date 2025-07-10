const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const bodyParser = require('body-parser');
const routes = require('./routes');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 3000;

// Middleware
app.use(helmet());
app.use(cors());
app.use(morgan('combined'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));


routes(app);


app.get("/", (req, res) => {
  res.send("Hello world!");
});

mongoose
  .connect(process.env.MONGODB_URI)
  .then(() => {
    console.log("Mongoose connected to MongoDB");
    // Now, you can safely start your server and perform database operations
    app.listen(port, () => {
      console.log(`App listening on port ${port}`);
    });
  })
  .catch((err) => {
    console.error("Mongoose connection error:", err);
  });