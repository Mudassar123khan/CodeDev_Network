import React, { useState } from "react";
import "./LeaderBoard.css";

function LeaderBoard() {
  const [userData, setUserData] = useState([
    {
      rank: 1,
      username: "XtremeWinger",
      problems_solved: 168,
      rating: 1452,
    },
    {
      rank: 1,
      username: "XtremeWinger",
      problems_solved: 168,
      rating: 1452,
    },
    {
      rank: 1,
      username: "XtremeWinger",
      problems_solved: 168,
      rating: 1452,
    },
    {
      rank: 1,
      username: "XtremeWinger",
      problems_solved: 168,
      rating: 1452,
    },
    {
      rank: 1,
      username: "XtremeWinger",
      problems_solved: 168,
      rating: 1452,
    },
    {
      rank: 1,
      username: "XtremeWinger",
      problems_solved: 168,
      rating: 1452,
    },
    {
      rank: 1,
      username: "XtremeWinger",
      problems_solved: 168,
      rating: 1452,
    },
    {
      rank: 1,
      username: "XtremeWinger",
      problems_solved: 168,
      rating: 1452,
    },
    {
      rank: 1,
      username: "XtremeWinger",
      problems_solved: 168,
      rating: 1452,
    },
    {
      rank: 1,
      username: "XtremeWinger",
      problems_solved: 168,
      rating: 1452,
    },
    {
      rank: 1,
      username: "XtremeWinger",
      problems_solved: 168,
      rating: 1452,
    },
    {
      rank: 1,
      username: "XtremeWinger",
      problems_solved: 168,
      rating: 1452,
    },
    {
      rank: 1,
      username: "XtremeWinger",
      problems_solved: 168,
      rating: 1452,
    },
    {
      rank: 1,
      username: "XtremeWinger",
      problems_solved: 168,
      rating: 1452,
    },
    {
      rank: 1,
      username: "XtremeWinger",
      problems_solved: 168,
      rating: 1452,
    },
    {
      rank: 1,
      username: "XtremeWinger",
      problems_solved: 168,
      rating: 1452,
    },
    {
      rank: 1,
      username: "XtremeWinger",
      problems_solved: 168,
      rating: 1452,
    },
    {
      rank: 1,
      username: "XtremeWinger",
      problems_solved: 168,
      rating: 1452,
    },
    {
      rank: 1,
      username: "XtremeWinger",
      problems_solved: 168,
      rating: 1452,
    },
  ]);

  return (
    <div className="leaderboard main-container">
      <div className="leaderboard-lower-half">
        <select name="platform" id="platform">
          <option value="overall">Overall</option>
          <option value="codeforces">Codeforces</option>
          <option value="leetcode">Leetcode</option>
          <option value="codechef">Codechef</option>
          <option value="geeksforgeek">GFG</option>
        </select>
        <div className="leaderboard-lower-half-headings">
          <p>Rank</p>
          <p>Username</p>
          <p>Number of Problems solved</p>
          <p>Rating</p>
        </div>

        {userData.map((user, index) => {
          return (
            <div key={index}>
              <div className="leaderboard-lower-half-content">
                <p>{user.rank}</p>
                <p>{user.username}</p>
                <p>{user.problems_solved}</p>
                <p>{user.rating}</p>
              </div>
            
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default LeaderBoard;
