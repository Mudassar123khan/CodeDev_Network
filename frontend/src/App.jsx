import React from 'react';
import NavBar from './components/Navbar/NavBar';
import { Route, Routes } from 'react-router-dom';
import Profile from './Pages/Profile/Profile';
import Home from './Pages/Home/Home'
import LeaderBoard from './Pages/LeaderBoard/LeaderBoard';
import Contest from './Pages/Contest/Contest';
import Discuss from './Pages/Discuss/Discuss';
import Learn from './Pages/Learn/Learn';
import Footer from './components/Footer/Footer';

function App() {
  return (
   <div className="app" id='app'>
    <NavBar/>
    <Routes>
      <Route path='/' element={<Home/>}/>
      <Route path='/profile' element={<Profile/>}/>
      <Route path='/leaderboard' element={<LeaderBoard/>}/>
      <Route path='/contest' element={<Contest/>}/>
      <Route path='/discuss' element={<Discuss/>}/>
      <Route path='/learn' element={<Learn/>}/>
    </Routes>

    <Footer/>
   </div>
  );
}

export default App;
