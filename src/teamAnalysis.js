const mockId = "1098669917550878720";

const PLAYER_ACQUISITION_TYPES = {
  add: "add",
  trade: "trade",
  draft: "draft",
};

const getTransactionAndMatchupsByWeek = async (week, leagueId) => {
  const transactions = await fetch(
    `https://api.sleeper.app/v1/league/${leagueId}/transactions/${week}`
  ).then((res) => res.json());
  const matchups = await fetch(
    `https://api.sleeper.app/v1/league/${leagueId}/matchups/${week}`
  ).then((res) => res.json());

  return { transactions, matchups };
};

export const analyzeLeague = async (leagueId) => {
  const league = await fetch(
    `https://api.sleeper.app/v1/league/${leagueId}`
  ).then((res) => res.json());

  const { draft_id, total_rosters, metadata, settings } = league;
  const draftId = draft_id;
  //   const winningRosterId = metadata.latest_league_winner_roster_id;
  const totalRosters = total_rosters;
  const firstWeek = settings.start_week;
  const regularSeasonLength = settings.playoff_week_start - firstWeek;

  // let scoringType = "standard";
  // if (league.settings.rec === "0.5") {
  //   scoringType = "half_ppr";
  // } else if (league.settings.rec === "1") {
  //   scoringType = "ppr";
  // }

  const teamsDict = {};

  // create team obj for each roster
  await fetch(`https://api.sleeper.app/v1/league/${leagueId}/rosters`)
    .then((res) => res.json())
    .then((rosters) => {
      rosters.forEach((roster) => {
        const { wins, total_moves } = roster.settings;
        const { roster_id, owner_id } = roster;
        teamsDict[roster_id] = {
          players: {},
          points: {
            adds: 0,
            trades: 0,
            draft: 0,
          },
          cumulativeWins: 0,
          messagesSent: 0,
          userId: owner_id,
          rosterId: roster_id,
          actualWins: wins,
          totalTransactions: total_moves,
        };
      });
    });

  // fetch draftpicks
  await fetch(`https://api.sleeper.app/v1/draft/${draftId}/picks`)
    .then((res) => res.json())
    .then((draftPicks) => {
      draftPicks.forEach((pick, i) => {
        // maybe we can go back later and edit this to calculate points by round and look at + / - points by round
        const { player_id, roster_id } = pick;
        teamsDict[roster_id].players[player_id] =
          PLAYER_ACQUISITION_TYPES.draft;
      });
    });

  const reduceTransactionData = (transactions) => {
    transactions.forEach((transaction) => {
      const { status, type, adds, drops } = transaction;
      if (status === "complete") {
        const playersAdded = Object.keys(adds ?? []);
        const playersDropped = Object.keys(drops ?? []);

        switch (type) {
          case "waiver":
          case "free_agent":
          case "commissioner":
            playersAdded.forEach((id) => {
              const rosterId = adds[id];
              teamsDict[rosterId].players[id] = PLAYER_ACQUISITION_TYPES.add;
            });
            break;
          case "trade":
            playersAdded.forEach((id) => {
              const rosterId = adds[id];
              teamsDict[rosterId].players[id] = PLAYER_ACQUISITION_TYPES.trade;
            });
            break;
          default:
            console.log("transaction type not recognized", type);
            break;
        }
        playersDropped.forEach((id) => {
          const rosterId = drops[id];
          delete teamsDict[rosterId].players[id];
        });
      }
    });
  };

  const reduceMatchupData = (matchups) => {
    matchups.sort((a, b) => b.points - a.points);

    matchups.forEach((matchup, i) => {
      const { roster_id, starters, players_points } = matchup;

      const potentialWins = totalRosters - 1 - i;

      teamsDict[roster_id].cumulativeWins += potentialWins;

      starters.forEach((id) => {
        const pointsScored = players_points[id];
        const playerAcquisitionType = teamsDict[roster_id].players[id];
        switch (playerAcquisitionType) {
          case PLAYER_ACQUISITION_TYPES.draft:
            teamsDict[roster_id].points.draft += pointsScored;
            break;
          case PLAYER_ACQUISITION_TYPES.add:
            teamsDict[roster_id].points.adds += pointsScored;
            break;
          case PLAYER_ACQUISITION_TYPES.trade:
            teamsDict[roster_id].points.trades += pointsScored;
            break;
          default:
            console.log(
              "invalid playerAcquisition type",
              playerAcquisitionType,
              id
              // teamsDict[roster_id].players
            );
            break;
        }
      });
    });
  };

  for (let i = firstWeek; i < firstWeek + regularSeasonLength; i++) {
    const { transactions, matchups } = await getTransactionAndMatchupsByWeek(
      i,
      leagueId
    );
    reduceTransactionData(transactions);
    reduceMatchupData(matchups);
  }

  const teamsDictEnum = Object.values(teamsDict);

  let bestDrafter;
  let worstDrafter;
  let bestTrader;
  let worstTrader;
  let bestWaiverWire;
  let bestMatchupLuck;
  let worstMatchupLuck;

  teamsDictEnum.forEach((team) => {
    const { adds, trades, draft } = team.points;

    const theoreticalWinPercentage =
      team.cumulativeWins / (regularSeasonLength * (totalRosters - 1));
    const actualWinPercentage = team.actualWins / regularSeasonLength;
    // high luck factor means team won more games than expected;
    const luckFactor = actualWinPercentage - theoreticalWinPercentage;

    if (!worstMatchupLuck || worstMatchupLuck.luckFactor > luckFactor) {
      worstMatchupLuck = { ...team, luckFactor };
    }
    if (!bestMatchupLuck || bestMatchupLuck.luckFactor < luckFactor) {
      bestMatchupLuck = { ...team, luckFactor };
    }
    if (!worstDrafter || worstDrafter.points.draft > draft) {
      bestMatchupLuck = { ...team, luckFactor };
    }
    if (!bestDrafter || bestDrafter.points.draft < draft) {
      bestDrafter = { ...team, luckFactor };
    }
    if (trades > 0 && (!worstTrader || worstTrader.points.trades > trades)) {
      worstTrader = { ...team, luckFactor };
    }
    if (!bestTrader || bestTrader.points.trades < trades) {
      bestTrader = { ...team, luckFactor };
    }
    if (!bestWaiverWire || bestWaiverWire.points.adds < adds) {
      bestWaiverWire = { ...team, luckFactor };
    }
  });

  return {
    bestDrafter,
    worstDrafter,
    bestTrader,
    worstTrader,
    bestWaiverWire,
    bestMatchupLuck,
    worstMatchupLuck,
  };
};

/*
                    OTHER //GET https://api.sleeper.app/v1/league/<league_id>/users -- . user.avatar
  // https://sleepercdn.com/avatars/thumbs/${user.avatar}
*/

