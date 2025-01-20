// scripts/updateData.js
import * as fs from "fs";
import * as path from "path";
import * as https from "https";

async function fetchJSON(url) {
  return new Promise((resolve, reject) => {
    https
      .get(url, (res) => {
        let data = "";
        res.on("data", (chunk) => (data += chunk));
        res.on("end", () => resolve(JSON.parse(data)));
      })
      .on("error", reject);
  });
}

async function updateData() {
  console.log("Fetching new data...");

  // Fetch players
  const players = await fetchJSON("https://api.sleeper.app/v1/players/nfl");

  // Fetch stats
  const stats = await fetchJSON(
    "https://api.sleeper.app/v1/stats/nfl/regular/2023"
  );

  // Filter player data
  const relevantKeys = [
    "player_id",
    "full_name",
    "position",
    "team",
    "fantasy_positions",
    "years_exp",
  ];

  const filteredPlayers = Object.entries(Object.values(players)[0]).reduce(
    (acc, [id, player], i) => {
      acc[id] = {};
      relevantKeys.forEach((key) => {
        acc[id][key] = player[key];
      });
      return acc;
    },
    {}
  );

  // Save files
  fs.writeFileSync(
    path.join(__dirname, "../data/players.json"),
    JSON.stringify(filteredPlayers, null, 2)
  );

  fs.writeFileSync(
    path.join(__dirname, "../data/stats-2023.json"),
    JSON.stringify(stats, null, 2)
  );

  console.log("Data updated successfully!");
}

updateData().catch(console.error);
