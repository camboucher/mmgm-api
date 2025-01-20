import { Transaction } from "./types";
import { calculatePointsAfterTransaction, getWeekFromTimestamp, insertSorted } from "../../utils";

export async function analyzeWaiverPickups(leagueId, weekStart, weekEnd) {
    try {
      // Fetch all transactions
      const transactions = [];
      for (let week = weekStart; week <= weekEnd; week++) {
        const response = await fetch(
          `https://api.sleeper.app/v1/league/${leagueId}/transactions/${week}`
        );
        const weekTransactions = await response.json();
        transactions.push(...weekTransactions);
      }
  
      // Fetch season stats
      const statsResponse = await fetch(`https://api.sleeper.app/v1/stats/nfl/regular/2024`);
      const seasonStats = await statsResponse.json();
  
      const waiverAnalysis = {};
  
      // Analyze waiver transactions
      transactions
        .filter(t => t.type === 'waiver' && t.status === 'complete')
        .forEach(transaction => {
          const rosterId = transaction.roster_ids[0];
          const addedPlayers = Object.keys(transaction.adds || {});
  
          addedPlayers.forEach(playerId => {
            const playerStats = seasonStats[playerId];
            if (!playerStats) return;
  
            const pointsAfterPickup = calculatePointsAfterTransaction(
              playerStats,
              transaction.created
            );
  
            if (!waiverAnalysis[rosterId]) {
              waiverAnalysis[rosterId] = {
                totalWaiverPoints: 0,
                bestPickups: []
              };
            }
  
            waiverAnalysis[rosterId].totalWaiverPoints += pointsAfterPickup;
  
            const pickup = {
              player_id: playerId,
              week: getWeekFromTimestamp(transaction.created),
              points: pointsAfterPickup
            };
  
            insertSorted(
              waiverAnalysis[rosterId].bestPickups,
              pickup,
              'points',
              3
            );
          });
        });
  
      return waiverAnalysis;
    } catch (error) {
      console.error('Error analyzing waiver pickups:', error);
      throw error;
    }
  }