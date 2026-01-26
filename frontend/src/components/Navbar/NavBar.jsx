import { Link } from "react-router-dom";
import "./NavBar.css";
import { assets } from "../../assets/assets.js";
import { useContext } from "react";
import { Context } from "../../context/AuthContext.jsx";
export default function NavBar() {
  const { token, setToken } = useContext(Context);

  //handler to show the sidebar
  const showSidebar = () => {
    const sidebar = document.querySelector(".sidebar");
    if(sidebar.classList.contains("show-sidebar")){
      sidebar.classList.remove("show-sidebar");
    }else{
      sidebar.classList.add("show-sidebar");
    }
  };

  //handler to logout user
  const logout = ()=>{
    localStorage.removeItem("token");
    setToken(null);
  }

  return (
    <div className="navbar">
      <Link to="/">
        <img src={assets.logo} alt="CodeDev_Network" className="logo" />
      </Link>

      <div className="navbar-left">
        <ul className="navbar-menu">
          <Link to="/contest" className="navbar-menu-element">Contest</Link>
          <Link to="/leaderboard" className="navbar-menu-element">Leaderboard</Link>
          <Link to="/problems" className="navbar-menu-element">Problems</Link>
        </ul>
      </div>

      <div className="navbar-right">
        <div className="login-signup-box">
          {token ? (
            <>
              <img
                onClick={showSidebar}
                className="profile-image"
                src={assets.profile_icon}
                alt="profile-img"
              ></img>{" "}
              <div className="sidebar" onClick={logout}>logout</div>
            </>
          ) : (
            <>
              <Link to="/login">Login</Link> /{" "}
              <Link to="/register">Register</Link>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
