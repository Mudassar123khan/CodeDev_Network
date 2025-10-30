import React, { useState } from 'react'
import './Profile.css'
import { assets } from '../../assets/assets';

function Profile() {

    const [rank,setRank] = useState(1000);

  return (
    <div className='profile main-container'>
        <div className="profile-description">
            <h3>username</h3>
            <p>Rank:{rank}</p>
        </div>
        <div className="rating-and-problem-graphs">
            <div className="profile-container">
                <div className="profile-container-text">
                    text
                </div>
               <div className="profile-container-picture">
                <img src={assets.profile_image} alt="profile image" />
                </div> 
            </div>

            <div className="rating-graph">
                Rating Graph
            </div>

            <div className="problems-graph">
                Problem Graph
            </div>
        </div>
    </div>
  )
}

export default Profile
