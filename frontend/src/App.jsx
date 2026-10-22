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
import ContestDetails from './Pages/Contest/ContestDetails.jsx';
import ContestLeaderBoard from './Pages/Contest/ContestLeaderBoard.jsx';
import Profile from './Pages/Profile/Profile.jsx';
import InterviewExperienceList from './Pages/InterviewExperience/InterviewExperienceList.jsx';
import InterviewExperienceForm from './Pages/InterviewExperience/InterviewExperienceForm.jsx';
import InterviewExperienceDetail from './Pages/InterviewExperience/InterviewExperienceDetail.jsx';
import Contact from './Pages/Contact/Contact.jsx';

function ProtectedRoute({ children }) {
  const { token } = useContext(Context);
  if (!token) {
    return <Navigate to="/login" replace />;
  }
  return children;
}

function App() {
  const { token } = useContext(Context);
  return (
    <div className="app" id='app'>
      <NavBar />
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
        <Route path='/' element={<Home />} />
        <Route path='/login' element={token ? <Navigate to='/' replace /> : <Login />} />
        <Route path='/register' element={token ? <Navigate to='/' replace /> : <Register />} />
        <Route path='/leaderboard' element={<ProtectedRoute><LeaderBoard /></ProtectedRoute>} />
        <Route path='/problems' element={<Problems />} />
        <Route path='/problems/:slug' element={<Problems />} />
        <Route path='/contest/:contestSlug/problems/:slug' element={<ProtectedRoute><ProblemDetails /></ProtectedRoute>} />
        <Route path='/contest' element={<ProtectedRoute><Contest /></ProtectedRoute>} />
        <Route path='/contest/:slug' element={<ProtectedRoute><ContestDetails /></ProtectedRoute>} />
        <Route path='/contest/:slug/leaderboard' element={<ProtectedRoute><ContestLeaderBoard /></ProtectedRoute>} />
        <Route path='/profile/:username' element={<ProtectedRoute><Profile /></ProtectedRoute>} />
        <Route path='/interviews' element={<InterviewExperienceList />} />
        <Route path='/interviews/new' element={<ProtectedRoute><InterviewExperienceForm /></ProtectedRoute>} />
        <Route path='/interviews/:id' element={<ProtectedRoute><InterviewExperienceDetail /></ProtectedRoute>} />
        <Route path='/contact' element={<Contact />} />
      </Routes>
    </div>
  );
}

export default App;
