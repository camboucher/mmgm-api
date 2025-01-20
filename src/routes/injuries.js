export async function analyzeInjuryLuck(leagueId) {
    try {
      // Fetch rosters and weekly lineups
    //   const rostersResponse = await fetch(`https://api.sleeper.app/v1/league/${leagueId}/rosters`);
    //   const rosters = await rostersResponse.json();
  
      const injuryAnalysis = {};
  
      // Analyze each week
      for (let week = 1; week <= 17; week++) {
        const lineupResponse = await fetch(
          `https://api.sleeper.app/v1/league/${leagueId}/lineups/${week}`
        );
        const lineups = await lineupResponse.json();
  
        // Get injury statuses for that week
        const injuryResponse = await fetch(
          `https://api.sleeper.app/v1/players/nfl/injuries/${week}`
        );
        const injuries = await injuryResponse.json();
  
        lineups.forEach(lineup => {
          const rosterId = lineup.roster_id;
          if (!injuryAnalysis[rosterId]) {
            injuryAnalysis[rosterId] = {
              gamesLostToInjury: 0,
              startersLostToInjury: 0,
              significantInjuries: []
            };
          }
  
          lineup.starters.forEach(playerId => {
            const injury = injuries[playerId];
            if (injury && injury.status === 'Out') {
              injuryAnalysis[rosterId].gamesLostToInjury++;
              injuryAnalysis[rosterId].startersLostToInjury++;
  
              injuryAnalysis[rosterId].significantInjuries.push({
                player_id: playerId,
                week,
                status: injury.status
              });
            }
          });
        });
      }
  
      return injuryAnalysis;
    } catch (error) {
      console.error('Error analyzing injuries:', error);
      throw error;
    }
  }