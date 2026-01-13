
import { createContext,useState } from "react";

export const Context = createContext(null);

export const ContextProvider = ({children})=>{
    const url = 'http://localhost:5000/api';

    const [token, setToken] = useState(null);

    const contextValue = {
        url,
        token,
        setToken
    }

    return (
        <Context.Provider value={contextValue}>
            {children}
        </Context.Provider>
    );
}