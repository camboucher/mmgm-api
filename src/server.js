const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
dotenv.config();
const leaguesRouter = require('./routes/leagues');

const app = express();
const port = process.env.PORT || 3000;

app.use(
  cors({
    origin: process.env.FRONTEND_URL || "http://localhost:5173",
  })
);
app.use(express.json()); // Parse JSON bodies
app.use(express.urlencoded({ extended: true })); // Parse URL-encoded bodies


// ROUTES
app.use('/leagues', leaguesRouter);


// Error handling middleware
const errorHandler = (err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: "Something went wrong!" });
};
app.use(errorHandler);

// Handle 404 errors
app.use((req, res) => {
  res.status(404).json({ error: "Not found" });
});

// Start server
app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});
