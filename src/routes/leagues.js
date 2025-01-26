const express = require("express");
const { analyzeLeague } = require("../teamAnalysis");
const router = express.Router();

router.get("/:leagueId", async (req, res) => {
  try {
    const { leagueId } = req.params;
    const leagueAnalysis = await analyzeLeague(leagueId);
    console.log(leagueAnalysis);

    return res.status(200).json({ leagueAnalysis });
  } catch (error) {
    console.error("Route handler error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

module.exports = router;
