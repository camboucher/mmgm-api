/*
fetch league
    store draftId
    store metadata.latest_league_winner_roster_id
fetch draft
    save metadata.scoring_type
fetch draftPicks
    initialize an array of teams. each team is a object (userId / rosterId) --> prob rosterId since that can be matched to matchups
        draft roster
        draft points
        waiver adds property (obj)
        waiver points
        trade adds property (obj)
        trade points
        messages sent
        cumulative w / l (play every team every week)


go week by week and fetch 
    transactions
        for each transaction
            check if status === complete
            if type === trade
                check rosters involved
                    if roster involved has traded players for that week add palyers to trade adds and reverse for other team
            if type === waiver || free agent
                add player to waiver obj
                delete dropped player from waiver adds fro that team
    
    matchups
        sort matchups by points
            for each matchup
                add to wins and losses based on index of matchup
                for each player
                    check if drafted / traded / waiver add and add points to appropriate category



                    OTHER //GET https://api.sleeper.app/v1/league/<league_id>/users -- . user.avatar
  // https://sleepercdn.com/avatars/thumbs/${user.avatar}
*/