import React, { useEffect, useState } from "react";
import styles from "./SnowEffect.module.css";
import BASE_URL from "Base/api";

const SnowEffect = () => {
  const [isEnabled, setIsEnabled] = useState(false);
  const [snowflakes, setSnowflakes] = useState([]);

  useEffect(() => {
    const fetchSnowSetting = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) return;

        const response = await fetch(
          `${BASE_URL}/AppSetting/IsAppSettingEnabled?nameOrId=IsSnowThemeEnabled`,
          {
            method: "GET",
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
          }
        );

        if (response.ok) {
          const data = await response.json();
          setIsEnabled(data === true);
        }
      } catch (error) {
        console.error("Error fetching snow theme setting:", error);
      }
    };

    fetchSnowSetting();

    // Check for setting changes every 30 seconds
    const interval = setInterval(fetchSnowSetting, 30000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (isEnabled) {
      // Generate snowflakes
      const flakes = [];
      for (let i = 0; i < 50; i++) {
        flakes.push({
          id: i,
          left: Math.random() * 100,
          animationDuration: 5 + Math.random() * 10,
          animationDelay: Math.random() * 5,
          size: 4 + Math.random() * 8,
          opacity: 0.6 + Math.random() * 0.4,
        });
      }
      setSnowflakes(flakes);
    } else {
      setSnowflakes([]);
    }
  }, [isEnabled]);

  if (!isEnabled) return null;

  return (
    <div className={styles.snowContainer}>
      {snowflakes.map((flake) => (
        <div
          key={flake.id}
          className={styles.snowflake}
          style={{
            left: `${flake.left}%`,
            animationDuration: `${flake.animationDuration}s`,
            animationDelay: `${flake.animationDelay}s`,
            width: `${flake.size}px`,
            height: `${flake.size}px`,
            opacity: flake.opacity,
          }}
        />
      ))}
    </div>
  );
};

export default SnowEffect;
