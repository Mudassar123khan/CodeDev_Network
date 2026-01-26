import React, { useContext } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import NavBar from './components/Navbar/NavBar.jsx';
import Register from './Pages/Auth/Register.jsx';
import Login from './Pages/Auth/Login.jsx';
import { Context } from './context/AuthContext.jsx';
import Home from './Pages/Home/Home.jsx';
import LeaderBoard from './Pages/LeaderBoard/LeaderBoard.jsx';
import Problems from './Pages/Problems/Problems.jsx';
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import ProblemDetails from './Pages/Problems/ProblemDetails.jsx';
import Contest from './Pages/Contest/Contest.jsx';
function App() {

  const {token} = useContext(Context);
  return (
   <div className="app" id='app'>
    <NavBar/> 
    <ToastContainer
        position="top-right"
        autoClose={3000}
        hideProgressBar={false}
        newestOnTop
        closeOnClick
        pauseOnHover
        theme="dark"
      />
      <Routes>
        <Route path='/' element={<Home/>}/>
        <Route path='/login' element={token?<Navigate to='/'/>:<Login/>}/>
        <Route path='/register' element={token?<Navigate to='/'/>:<Register/>}/>
        <Route path='/leaderboard' element={token?<LeaderBoard/>:<Login/>}/>
        <Route path='/problems' element={<Problems/>}/>
        <Route path='/problems/:slug' element={token?<ProblemDetails/>:<Login/>}/>
        <Route path='/contest' element={token?<Contest/>:<Login/>}/>
      </Routes>
   </div>
  );
}

export default App;
