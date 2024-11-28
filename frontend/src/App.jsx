import { useEffect } from "react";
import axios from "axios";

const App = () => {
  const handleLogin = () => {
    window.location.href = "http://localhost:4000/auth/twitter"; // Backend URL
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
