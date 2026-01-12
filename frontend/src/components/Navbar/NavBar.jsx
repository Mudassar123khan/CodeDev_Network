import {Link} from 'react-router-dom';
import './NavBar.css';
import {assets} from '../../assets/assets.js';
export default function NavBar(){
  return(
    <div className="navbar">
      
        <Link>
        <img src={assets.logo} alt='CodeDev_Network' className='logo'/>
        </Link>

       <div className="navbar-left">
        
        <ul className='navbar-menu'>
        <Link>
        Contest
        </Link>
        <Link>
        Leaderboard
        </Link>
        <Link>
        Problems
        </Link>
        </ul>
       </div>



      <div className="navbar-right">

      </div>
    </div>
  );
}