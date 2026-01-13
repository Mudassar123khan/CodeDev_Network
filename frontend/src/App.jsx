import React from 'react';
import { Route, Routes } from 'react-router-dom';
import NavBar from './components/Navbar/NavBar.jsx';
import Register from './Pages/Auth/Register.jsx';
import Login from './Pages/Auth/Login.jsx';
function App() {
  return (
   <div className="app" id='app'>
    <NavBar/> 
    <Register/>
    <Login/> 
   </div>
  );
}

export default App;
