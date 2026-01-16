import "./Leaderboard.css";
import { leaderboard } from "../../api/leaderboard.api";
import { useContext, useEffect, useState } from "react";
import { Context } from "../../context/AuthContext";

export default function Leaderboard() {
    const [data,setData] = useState([]);
    const [platform,setPlatform] = useState("");
    const {url, token} = useContext(Context);


    //calls the fetchLeaderboardDetails function on every reload
    useEffect(()=>{
      fetchLeaderboardDetails();
    },[platform]);


    //function which calls the api function
    const fetchLeaderboardDetails = async ()=>{
        const response = await leaderboard(platform,url,token);
        setData(response.data);
    }

   //handler for platform capturing
   const onClickHandler = (e)=>{
      const {name,value} = e.target;
      console.log("Clicked");
      console.log(value);
      setPlatform(value);
   }


  return (
    <div className="leaderboard">
      <button name="leetcode" value='leetcode' onClick={onClickHandler}>Leetcode</button>
      <button name="codeforces" value='codeforces' onClick={onClickHandler}>Codeforces</button>
      <button name="codechef" value='codechef' onClick={onClickHandler}>Codechef</button>

      <table className="leaderboard-table">
        <thead>
          <tr>
            <th>Rank</th>
            <th>User</th>
            <th>Total</th>
          </tr>
        </thead>
        <tbody>
          {data.map((user,index) => (
            <tr key={user._id}>
              <td>{index+1}</td>
              <td>{user.userId.username}</td>
              <td>{user.totalScore}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
