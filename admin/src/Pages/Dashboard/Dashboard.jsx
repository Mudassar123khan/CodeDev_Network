import React, { useContext } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { Context } from '../../context/AuthContext';
import './Dashboard.css';

export default function Dashboard() {
  const { setToken, setUser } = useContext(Context);
  const navigate = useNavigate();

  const handleLogout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate('/admin/login');
  };

  return (
    <div className="dashboard-container">
      {/* Sidebar */}
      <aside className="sidebar">
        <div className="sidebar-header">
          Admin Panel
        </div>
        <nav className="sidebar-nav">
          <NavLink 
            to="/admin/dashboard/users" 
            className={({ isActive }) => (isActive ? 'sidebar-link active' : 'sidebar-link')}
          >
            Manage Users
          </NavLink>
          <NavLink 
            to="/admin/dashboard/problems" 
            className={({ isActive }) => (isActive ? 'sidebar-link active' : 'sidebar-link')}
          >
            Manage Problems
          </NavLink>
          <NavLink 
            to="/admin/dashboard/contests" 
            className={({ isActive }) => (isActive ? 'sidebar-link active' : 'sidebar-link')}
          >
            Manage Contests
          </NavLink>
          <NavLink 
            to="/admin/dashboard/interviews" 
            className={({ isActive }) => (isActive ? 'sidebar-link active' : 'sidebar-link')}
          >
            Manage Interviews
          </NavLink>
        </nav>
      </aside>

      {/* Main Content Area */}
      <main className="main-content">
        <header className="content-header">
          <button className="logout-btn" onClick={handleLogout}>Logout</button>
        </header>

        <section className="content-area">
          <Outlet />
        </section>
      </main>
    </div>
  );
}
