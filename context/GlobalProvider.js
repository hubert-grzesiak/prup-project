import { createContext, useContext, useState, useEffect } from "react";
import { getCurrentUser, getList, addToWatchlist as addShowToWatchlist } from "../lib/appwrite";

const GlobalContext = createContext();
export const useGlobalContext = () => useContext(GlobalContext);

const GlobalProvider = ({ children }) => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [watchlist, setWatchlist] = useState([]);
  const [needsRefresh, setNeedsRefresh] = useState(false);

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

  useEffect(() => {
    if (needsRefresh) {
      const fetchWatchlist = async () => {
        const items = await getList();
        setWatchlist(items);
        setNeedsRefresh(false);
      };
      fetchWatchlist();
    }
  }, [needsRefresh]);

  const addToWatchlist = async (id) => {
    await addShowToWatchlist(id);
    setNeedsRefresh(true);
  };

  return (
    <GlobalContext.Provider
      value={{
        isLoggedIn,
        user,
        setUser,
        setIsLoggedIn,
        loading,
        watchlist,
        addToWatchlist,
        setNeedsRefresh,
      }}
    >
      {children}
    </GlobalContext.Provider>
  );
};

export default GlobalProvider;
