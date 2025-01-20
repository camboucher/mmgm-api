import { calculateMedian } from "../../utils";

export async function analyzeMatchupLuck(leagueId: string) {
  try {
    const matchupAnalysis = {};
    const weeklyScores: { week: number; median: number }[] = [];

    // Gather all weekly scores and matchups
    for (let week = 1; week <= 17; week++) {
      const matchupsResponse = await fetch(
        `https://api.sleeper.app/v1/league/${leagueId}/matchups/${week}`
      );
      const matchups = await matchupsResponse.json();

      // Calculate median score for the week
      const weekScores = matchups.map((m) => m.points);
      const medianScore = calculateMedian(weekScores);
      weeklyScores.push({ week, median: medianScore });

      matchups.forEach((matchup) => {
        const rosterId = matchup.roster_id;
        if (!matchupAnalysis[rosterId]) {
          matchupAnalysis[rosterId] = {
            expectedWins: 0,
            actualWins: 0,
            unluckyLosses: [],
            luckyWins: [],
          };
        }

        // Calculate expected wins based on scoring relative to league
        const wouldBeatCount = weekScores.filter(
          (score) => matchup.points > score
        ).length;
        const expectedWinPct = wouldBeatCount / weekScores.length;
        matchupAnalysis[rosterId].expectedWins += expectedWinPct;

        // Find opponent's score
        const opponent = matchups.find(
          (m) => m.matchup_id === matchup.matchup_id && m.roster_id !== rosterId
        );

        if (opponent) {
          const won = matchup.points > opponent.points;
          if (won) {
            matchupAnalysis[rosterId].actualWins++;
            // Lucky win if you scored below median but won
            if (matchup.points < medianScore) {
              matchupAnalysis[rosterId].luckyWins.push({
                week,
                points: matchup.points,
                opponentPoints: opponent.points,
                medianScore,
              });
            }
          } else if (matchup.points > medianScore) {
            // Unlucky loss if you scored above median but lost
            matchupAnalysis[rosterId].unluckyLosses.push({
              week,
              points: matchup.points,
              opponentPoints: opponent.points,
              medianScore,
            });
          }
        }
      });
    }

    // Calculate luck rating
    Object.keys(matchupAnalysis).forEach((rosterId) => {
      const analysis = matchupAnalysis[rosterId];
      analysis.luckRating = analysis.actualWins - analysis.expectedWins;
    });

    return matchupAnalysis;
  } catch (error) {
    console.error("Error analyzing matchup luck:", error);
    throw error;
  }
}
