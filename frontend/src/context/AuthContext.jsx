
import { createContext,useEffect,useState } from "react";

export const Context = createContext(null);

export const ContextProvider = ({children})=>{
<<<<<<< HEAD
    const url = 'http://localhost:5000/api';
    //const url = 'https://codedev-network.onrender.com/api';
=======
    //const url = 'http://localhost:3000/api';
    const url = 'https://codedev-network-1.onrender.com/api';
>>>>>>> 044ada0e223f46875314e3ac407b06b8d569a9d8

    const [token, setToken] = useState(null);
    const [user,setUser] = useState(null);

    const contextValue = {
        url,
        token,
        setToken,
        setUser,
        user
    }

    //useeffect to set the token after referesh
    useEffect(()=>{
        if(localStorage.getItem("token")){
            setToken(localStorage.getItem("token"));
            setUser(localStorage.getItem("user"));
        }
    },[]);

    return (
        <Context.Provider value={contextValue}>
            {children}
        </Context.Provider>
    );
}
