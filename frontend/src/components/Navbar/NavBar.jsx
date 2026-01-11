import {Link} from 'react-router-dom';
import './NavBar.css';
import {assets} from '../../assets/assets.js';
export default function NavBar(){
  return(
    <div className="navbar">
      <div className="navbar-left">
        <Link>
        <img src={assets.logo} alt='CodeDev_Network' className='logo'/>
        </Link>

        <Link>
        Contest
        </Link>
        <Link>
        Leaderboard
        </Link>
        <Link>
        Problems
        </Link>
      </div>


      <div className="navbar-right">

      </div>
    </div>
  );
}