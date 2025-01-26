// const leagueId = "1098669917550878720";

const PLAYER_ACQUISITION_TYPES = {
  add: "add",
  trade: "trade",
  draft: "draft",
};

const EMPTY_TEAM_OBJ = {
  userId: "",
  rosterId: "",
  players: {
    /*
      "id": "add" | "trade" | "draft"
      */
  },
  points: {
    adds: 0,
    trades: 0,
    draft: 0,
  },
  totalTransactions: 0,
  cumulativeWins: 0,
  actualWins: 0,
  messagesSent: 0,
};

const getTransactionAndMatchupsByWeek = async (week) => {
  const transactions = await fetch(
    `https://api.sleeper.app/v1/league/${leagueId}/transactions/${week}`
  ).then((res) => res.json());
  const matchups = await fetch(
    `https://api.sleeper.app/v1/league/${leagueId}/matchups/${week}`
  ).then((res) => res.json());

  return { transction, matchups };
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
          ...EMPTY_TEAM_OBJ,
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
      draftPicks.forEach((pick) => {
        // maybe we can go back later and edit this to calculate points by round and look at + / - points by round
        const { roster_id, player_id } = pick;
        teamsDict[roster_id].players[player_id] =
          PLAYER_ACQUISITION_TYPES.draft;
      });
    });

  // instanstiate array to track transactions and matchups by week. start with first week
  const weeks = new Array(regularSeasonLength);

  const reduceTransactionData = (transactions) => {
    transactions.forEach((transaction) => {
      const { status, type, adds, drops } = transaction;
      if (status === "complete") {
        const playersAdded = Object.keys(adds);
        const playersDropped = Object.keys(drops);
        switch (type) {
          case "waiver":
          case "free_agent":
            playersAdded.forEach((id) => {
              const rosterId = adds[id];
              teamsDict[rosterId].players[id] = PLAYER_ACQUISITION_TYPES.add;
            });
          case "trade":
            playersAdded.forEach((id) => {
              const rosterId = adds[id];
              teamsDict[rosterId].players[id] = PLAYER_ACQUISITION_TYPES.trade;
            });
          default:
            console.log("transaction type not recognized", type);
            break;
        }
        playersDropped.forEach((id) => {
          delete teamsDict[rosterId].player_id[id];
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
          case playerAcquisitionType.add:
            teamsDict[roster_id].points.adds += pointsScored;
          case playerAcquisitionType.draft:
            teamsDict[roster_id].points.trades += pointsScored;
          default:
            console.log(
              "invalid playerAcquisition type",
              playerAcquisitionType
            );
            break;
        }
      });
    });
  };

  await weeks.forEach(async (week, i) => {
    const { transactions, matchups } = await getTransactionAndMatchupsByWeek(
      i + firstWeek
    );
    reduceTransactionData(transactions);
    reduceMatchupData(matchups);
  });

  const teamsDictEnum = Object.values(teamsDict);
  const bestDrafter = [null, 0];
  const worstDrafter = [null, Infinity];
  const bestTrader = [null, 0];
  const worstTrader = [null, Infinity];
  const bestWaiverWire = [null, 0];
  const bestMatchupLuck = [null, -1];
  const worstMatchupLuck = [null, 1];

  teamsDictEnum.forEach((team) => {
    const { adds, trades, draft } = team.points;

    const theoreticalWinPercentage =
      team.cumulativeWins / (regularSeasonLength * (totalRosters - 1));
    const actualWinPercentage = team.actualWins / regularSeasonLength;
    // high luck factor means team won more games than expected;
    const luckFactor = actualWinPercentage - theoreticalWinPercentage;

    if (!worstMatchupLuck[0] || worstMatchupLuck[1] < luckFactor) {
      worstMatchupLuck = [team[rosterid], luckFactor];
    }
    if (!bestMatchupLuck[0] || bestMatchupLuck[1] > luckFactor) {
      bestMatchupLuck = [team[rosterid], luckFactor];
    }
    if (!worstDrafter[0] || worstDrafter[1] < draft) {
      worstDrafter = [team[rosterid], draft];
    }
    if (!bestDrafter[0] || bestDrafter[1] > draft) {
      bestDrafter = [team[rosterid], draft];
    }
    if (!worstTrader[0] || worstTrader[1] < trades) {
      worstTrader = [team[rosterid], trade];
    }
    if (!bestTrader[0] || bestTrader[1] > trades) {
      bestTrader = [team[rosterid], trades];
    }
    if (!bestWaiverWire[0] || bestWaiverWire[1] > adds) {
      bestWaiverWire = [team[rosterid], adds];
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
