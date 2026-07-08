import { Routes, Route, Navigate } from 'react-router-dom';
import { useContext } from 'react';
import { Context } from './context/AuthContext';
import AdminLogin from './Pages/Auth/AdminLogin';
import AdminRegister from './Pages/Auth/AdminRegister';
import Dashboard from './Pages/Dashboard/Dashboard';
import UsersManage from './Pages/Users/UsersManage';
import ProblemsManage from './Pages/Problems/ProblemsManage';
import ContestsManage from './Pages/Contests/ContestsManage';
import InterviewsManage from './Pages/Interviews/InterviewsManage';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const ProtectedRoute = ({ children }) => {
  const { token, user } = useContext(Context);
  if (!token || user?.role !== 'admin') {
    return <Navigate to="/admin/login" />;
  }
  return children;
};
import 'react-toastify/dist/ReactToastify.css';

function App() {
  return (
    <>
      <ToastContainer position="top-right" autoClose={3000} />
      <Routes>
        <Route path="/admin/login" element={<AdminLogin />} />
        <Route path="/admin/register" element={<AdminRegister />} />
        
        <Route path="/admin/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>}>
          <Route index element={<Navigate to="users" />} />
          <Route path="users" element={<UsersManage />} />
          <Route path="problems" element={<ProblemsManage />} />
          <Route path="contests" element={<ContestsManage />} />
          <Route path="interviews" element={<InterviewsManage />} />
        </Route>

        <Route path="*" element={<Navigate to="/admin/dashboard" />} />
      </Routes>
    </>
  )
}

export default App
