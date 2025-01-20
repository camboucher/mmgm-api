const express = require("express");
const router = express.Router();

const fetchLeague = async (leagueId) => {
  const league = await fetch(`https://api.sleeper.app/v1/league/${leagueId}`)
    .then((data) => data.json())
    .catch((e) => e);
  return league;
};

router.get('/:leagueId', async (req, res) => {
  try {
    const { leagueId } = req.params;  // Get from URL params instead of body
    const leagueData = await fetchLeague(leagueId);
    
    if (Object.keys(leagueData).length) {
      return res.status(200).json({ leagueId });
    }
    return res.status(404).json({ message: "Couldn't fetch league data" });
  } catch (error) {
    console.error('Route handler error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

module.exports = router;
