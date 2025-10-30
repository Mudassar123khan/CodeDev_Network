import React, { useState } from 'react'
import './NavBar.css'
import { Link } from 'react-router-dom';
import { assets } from '../../assets/assets';
function NavBar() {

    const [login,setLogin] = useState("Sign Up");

  return (
    <nav className='navbar'>
      <Link to={'/'}> <img src={assets.logo} alt="logo" className='logo' /></Link>
      
      <ul className="navbar-menu">
        <Link to={'/contest'}>Contest</Link>
        <Link to={'/leaderboard'}>Leaderboard</Link>
        <Link to={'/discuss'}>Discuss</Link> 
        <Link to={'/learn'}>Learn</Link>
      </ul>

      <div className="navbar-right">
        <div className="narbar-profile">
            <Link to={'/profile'}> <img src="#" alt="profile image" /> </Link>
        </div>
        <button>{login}</button>
      </div>
    </nav>
  )
}

export default NavBar
