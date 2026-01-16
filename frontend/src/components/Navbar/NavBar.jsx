import {Link} from 'react-router-dom';
import './NavBar.css';
import {assets} from '../../assets/assets.js';
import { useContext } from 'react';
import { Context } from '../../context/AuthContext.jsx';
export default function NavBar(){

  const {token} = useContext(Context);

  return(
    <div className="navbar">
      
        <Link to='/'>
        <img src={assets.logo} alt='CodeDev_Network' className='logo'/>
        </Link>

       <div className="navbar-left">
        
        <ul className='navbar-menu'>
        <Link>
        Contest
        </Link>
        <Link to='/leaderboard'>
        Leaderboard
        </Link>
        <Link to='/problems'>
        Problems
        </Link>
        </ul>
       </div>



      <div className="navbar-right">
        <div className="login-signup-box">
          {token?<img src={assets.profile_icon} alt='profile-img'></img>:<><Link to='/login'>Login</Link> / <Link to='/register'>Register</Link></>}
        </div>
      </div>
    </div>
  );
}