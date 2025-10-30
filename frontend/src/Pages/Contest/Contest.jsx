import React from 'react'
import './Contest.css'
import { useState } from 'react';
function Contest() {

   const [userData, setUserData] = useState([
      {
        rank: 1,
        username: "XtremeWinger",
  
        rating: 1452,
      },
      {
        rank: 1,
        username: "XtremeWinger",
     
        rating: 1452,
      },
      {
        rank: 1,
        username: "XtremeWinger",
   
        rating: 1452,
      },
      {
        rank: 1,
        username: "XtremeWinger",
     
        rating: 1452,
      },
      {
        rank: 1,
        username: "XtremeWinger",
   
        rating: 1452,
      },
      {
        rank: 1,
        username: "XtremeWinger",
    
        rating: 1452,
      },
    ]);


    const [contest,setContest] = useState([
      {
        contest:"Weekly #1",
        time:"10AM",
        writer:"XtremeWinger",
    
      },
      {
        contest:"Weekly #2",
        time:"10AM",
        writer:"XtremeWinger",
  
      },
      {
        contest:"Weekly #3",
        time:"10AM",
        writer:"XtremeWinger",
    
      },
      {
        contest:"Weekly #4",
        time:"10AM",
        writer:"XtremeWinger",
     
      },
    ]);


  return (
    <div className='contest-page main-container'>
      <div className="contest-page-left">
        <div className="contest-page-left-top">
            <h2>Upcoming Contests</h2>
            <div className="contest-page-left-top-heading">
              <p>Contest</p>
              <p>Writer</p>
              <p>Time</p>
            </div>
            {
              contest.map((cont, index)=>{
                return (
                  <div className="upcoming-contest-box" key={index}>
                    <p>{cont.contest}</p>
                    <p>{cont.writer}</p>
                    <p>{cont.time}</p>
                    <p>{cont.timer}</p>
                  </div>
                );
              })
            }
        </div>
        <div className="contest-page-left-bottom">
          <h2>Previous Contests</h2>
        </div>
      </div>

      <div className="contest-page-right">
        <div className="contest-page-right-heading">
          <p>Rank</p>
          <p>Username</p>
          <p>Rating</p>
        </div>
        {
            userData.map((user,index)=>{
                return (
                  <div className='contest-page-right-content-container' key={index}>
                    <div className="contest-page-right-content" >
                  <p>{user.rank}</p>
                  <p>{user.username}</p>
                  <p>{user.rating}</p>
                </div>
                {/* <hr /> */}
                  </div>
                );
              
            })
          }
      </div>
    </div>
  )
}

export default Contest
