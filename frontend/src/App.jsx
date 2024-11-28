import { useEffect, useState } from "react";
import axios from "axios";

const App = () => {
  const [twitterUsername, setTwitterUsername] = useState(null);
  const [loading, setLoading] = useState(true);

  const handleLogin = () => {
    window.location.href = "http://localhost:4000/auth/twitter"; // Backend OAuth URL
  };

  const fetchUserData = async (token) => {
    try {
      const response = await axios.get("https://api.twitter.com/2/users/me", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      console.log("User Data:", response.data);
      setTwitterUsername(response.data.data.username); // Save Twitter username
    } catch (error) {
      console.error("Failed to fetch user data:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const query = new URLSearchParams(window.location.search);
    const token = query.get("token");
    if (token) {
      fetchUserData(token); // Fetch user data from Twitter
    } else {
      setLoading(false);
    }
  }, []);

  return (
    <div>
      <h1>Twitter OAuth 2.0 Login</h1>
      {loading ? (
        <p>Loading...</p>
      ) : !twitterUsername ? (
        <button onClick={handleLogin}>Login with Twitter</button>
      ) : (
        <div>
          <p>Successfully connected to Twitter! Username: {twitterUsername}</p>
          <button
            onClick={() =>
              (window.location.href = "https://telegramxraid.vercel.app/")
            }
          >
            Return to Telegram
          </button>
        </div>
      )}
    </div>
  );
};

export default App;

/*
import { useEffect } from "react";
import axios from "axios";

const App = () => {
  const handleLogin = () => {
    window.location.href = "http://localhost:4000/auth/twitter"; 
  };

  const fetchUserData = async (token) => {
    try {
      const response = await axios.get("https://api.twitter.com/2/users/me", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      console.log("User Data:", response.data);
    } catch (error) {
      console.error("Failed to fetch user data:", error);
    }
  };

  useEffect(() => {
    const query = new URLSearchParams(window.location.search);
    const token = query.get("token");
    if (token) {
      fetchUserData(token);
    }
  }, []);

  return (
    <div>
      <h1>Connect X Account</h1>
      <button onClick={handleLogin}>Login with X</button>
    </div>
  );
};

export default App;

*/
