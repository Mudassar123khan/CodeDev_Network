import "./Register.css";
import {register} from "../../api/auth.api";
import { useState, useContext } from "react";
import { Context } from "../../context/AuthContext";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
export default function Register() {
const {url} = useContext(Context);
const navigate = useNavigate();
  const [data, setData] = useState({
    username: "",
    email: "",
    password: "",
    platforms:{
        leetcode: "",
        codeforces: "",
        codechef: "",
        gfg: "",
    }
    
  });

  //function to set the data coming from input form in state variable data
  const onChangeHandler = (e) => {
  const { name, value } = e.target;

  // check if input belongs to platforms
  if (name in data.platforms) {
    setData((prev) => ({
      ...prev,
      platforms: {
        ...prev.platforms,
        [name]: value,
      },
    }));
  } else {
    // top-level fields
    setData((prev) => ({
      ...prev,
      [name]: value,
    }));
  }
};


  //function to register a user
  const registerHandler = async (event) => {
    event.preventDefault();

    const response = await register(data,url);

    if(response.data.success){
        toast.success("Account created successfully");
        navigate("/login");
    }else{
        toast.error(response.message);
    }
  };

  return (
    <div className="register">
      <form onSubmit={registerHandler} className="register-form">
        <input
          type="text"
          name="username"
          onChange={onChangeHandler}
          value={data.username}
          className="username"
          placeholder="Username"
          required
        />

        <input
          type="email"
          name="email"
          onChange={onChangeHandler}
          value={data.email}
          className="email"
          placeholder="Email"
          required
        />

        <input
          type="password"
          name="password"
          onChange={onChangeHandler}
          value={data.password}
          className="password"
          placeholder="Password"
          required
        />

        <div className="handles-grid">
        <input
          type="text"
          name="leetcode"
          onChange={onChangeHandler}
          value={data.leetcode}
          className="leetcode"
          placeholder="leetcode username"
        />

        <input
          type="text"
          name="gfg"
          onChange={onChangeHandler}
          value={data.gfg}
          className="gfg"
          placeholder="gfg username"
        />

        <input
          type="text"
          name="codeforces"
          onChange={onChangeHandler}
          value={data.codeforces}
          className="codeforces"
          placeholder="Codeforces username"
        />

        <input
          type="text"
          name="codechef"
          onChange={onChangeHandler}
          value={data.codechef}
          className="codechef"
          placeholder="Codechef username"
        />
        </div>
        <button type="submit" >Create Account</button>
        <p className="login-link">
          Already have an account? <Link to="/login">Login</Link>
        </p>
      </form>
      
    </div>
  );
}
