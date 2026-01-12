
import { createContext,useState } from "react";

export const Context = createContext(null);

export const ContextProvider = ({children})=>{
    const url = 'http://localhost:5000/api';

    const contextValue = {
        url
    }

    return (
        <Context.Provider value={contextValue}>
            {children}
        </Context.Provider>
    );
}