import { createContext, useContext, useState, useEffect } from "react";
import { getCurrentUser } from "../lib/appwrite";

const GlobalContext = createContext();
export const useGlobalContext = () => useContext(GlobalContext);

const GlobalProvider = ({ children }) => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Efekt do pobrania danych o bieżącym użytkowniku
  useEffect(() => {
    const loadCurrentUser = async () => {
      try {
        const currentUser = await getCurrentUser();
        if (currentUser) {
          setUser(currentUser);
          setIsLoggedIn(true);
        }
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };
    loadCurrentUser();
  }, []);

  return (
    <GlobalContext.Provider
      value={{
        isLoggedIn,
        user,
        setUser,
        setIsLoggedIn,
        loading,
      }}>
      {children}
    </GlobalContext.Provider>
  );
};

export default GlobalProvider;
