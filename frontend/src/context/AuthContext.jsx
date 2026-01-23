
import { createContext,useEffect,useState } from "react";

export const Context = createContext(null);

export const ContextProvider = ({children})=>{
    const url = 'http://localhost:5000/api';

    const [token, setToken] = useState(null);

    const contextValue = {
        url,
        token,
        setToken
    }

    //useeffect to set the token after referesh
    useEffect(()=>{
        if(localStorage.getItem("token")){
            setToken(localStorage.getItem("token"));
        }
    },[]);

    return (
        <Context.Provider value={contextValue}>
            {children}
        </Context.Provider>
    );
}