import { calculateExpectedValue, calculateSeasonPoints, insertSorted } from "../../utils";
import { DraftPick } from "./types";

export async function analyzeDraftValue(leagueId) {
  try {
    // Fetch draft results
    const draftResponse = await fetch(
      `https://api.sleeper.app/v1/draft/${leagueId}/picks`
    );
    const draftPicks = await draftResponse.json();

    // Fetch season-long player stats
    const statsResponse = await fetch(
      `https://api.sleeper.app/v1/stats/nfl/regular/2024`
    );
    const seasonStats = await statsResponse.json();

    const draftAnalysis = {};

    // Calculate value over expected for each pick
    draftPicks.forEach((pick) => {
      const playerStats = seasonStats[pick.player_id];
      if (!playerStats) return;

      // Calculate expected value based on draft position
      const expectedPoints = calculateExpectedValue(
        pick.round,
        pick.draft_slot
      );
      const actualPoints = calculateSeasonPoints(playerStats);
      const valueOverExpected = actualPoints - expectedPoints;

      if (!draftAnalysis[pick.picked_by]) {
        draftAnalysis[pick.picked_by] = {
          totalValueOverExpected: 0,
          bestPicks: [],
          worstPicks: [],
        };
      }

      draftAnalysis[pick.picked_by].totalValueOverExpected += valueOverExpected;

      // Track best/worst picks
      const pickAnalysis = {
        player_id: pick.player_id,
        round: pick.round,
        valueOverExpected,
      };

      const picks = draftAnalysis[pick.picked_by].bestPicks;
      insertSorted(picks, pickAnalysis, "valueOverExpected", 3);
    });

    return draftAnalysis;
  } catch (error) {
    console.error("Error analyzing draft:", error);
    throw error;
  }
}
