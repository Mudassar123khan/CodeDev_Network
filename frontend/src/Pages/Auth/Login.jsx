import { login } from "../../api/auth.api.js";
import { useContext, useState } from "react";
import { Context } from "../../context/AuthContext.jsx";
import './login.css';
import { Link } from "react-router-dom";
export default function Login() {
  //using the context api to access url, token, setToken from AuthContext
  const { url, token, setToken } = useContext(Context);
  //state variable to store the user login credentials
  const [data, setData] = useState({
    email: "",
    password: "",
  });

  //on change handler to catch the input values
  const onChangeHandler = (e) => {
    const { name, value } = e.target;

    setData((data) => ({ ...data, [name]: value }));
  };

  //function to call the login function
  const loginHandler = async (event) => {
    event.preventDefault();
    const res = await login(data, url);

    if (res.data.success) {
      console.log("loggedIn");
        setToken(res.data.token);
        // after successful login API response
        localStorage.setItem("token", res.data.token);
    } else {
      console.log(`An error occured, ${res.data.message}`);
    }
  };
  return (
    <div className="login">
      <form className="login-form" onSubmit={loginHandler}>
        <input
          type="text"
          name="email"
          value={data.email}
          onChange={onChangeHandler}
          placeholder="email"
          required
        />
        <input
          type="password"
          name="password"
          value={data.password}
          onChange={onChangeHandler}
          placeholder="password"
          required
        />

        <button>Login</button>
        <p className="login-link">
          Create an account! <Link to="/register">Register</Link>
        </p>
      </form>

      
    </div>
  );
}
