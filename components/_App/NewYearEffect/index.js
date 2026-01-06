import React, { useEffect, useState } from "react";
import styles from "./NewYearEffect.module.css";
import BASE_URL from "Base/api";

const NewYearEffect = () => {
  const [isEnabled, setIsEnabled] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const [items, setItems] = useState([]);
  const [firecrackers, setFirecrackers] = useState([]);

  useEffect(() => {
    const fetchNewYearSetting = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) return;

        const response = await fetch(
          `${BASE_URL}/AppSetting/IsAppSettingEnabled?nameOrId=IsNewYearThemeEnabled`,
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
        console.error("Error fetching new year theme setting:", error);
      }
    };

    fetchNewYearSetting();
  }, []);

  useEffect(() => {
    if (isEnabled) {
      // Wait 2 minutes (120000ms) after login to show effect
      const timer = setTimeout(() => {
        setIsVisible(true);
        generateItems();
        startFirecrackers();
      }, 120000); // 2 minutes

      return () => clearTimeout(timer);
    }
  }, [isEnabled]);

  const generateItems = () => {
    const words = [
      "කවුම්", "කොකිස්", "kawum", "kokis",
      "🎆", "🎇", "🧨", "✨",
      "සුභ අලුත් අවුරුද්දක්", "Happy New Year"
    ];
    const colors = ["#ff0000", "#ffd700", "#ff6600", "#ff1493", "#00ff00", "#ff4500"];

    const newItems = [];
    for (let i = 0; i < 40; i++) {
      newItems.push({
        id: i,
        text: words[Math.floor(Math.random() * words.length)],
        left: Math.random() * 100,
        animationDuration: 4 + Math.random() * 6,
        animationDelay: Math.random() * 8,
        color: colors[Math.floor(Math.random() * colors.length)],
        fontSize: 14 + Math.random() * 16,
        rotation: -30 + Math.random() * 60,
      });
    }
    setItems(newItems);
  };

  const startFirecrackers = () => {
    const createFirecracker = () => {
      const id = Date.now() + Math.random();
      const colors = ["#ff0000", "#ffd700", "#ff6600", "#00ff00", "#ff1493"];

      const newFirecracker = {
        id,
        left: 10 + Math.random() * 80,
        top: 20 + Math.random() * 60,
        color: colors[Math.floor(Math.random() * colors.length)],
      };

      setFirecrackers(prev => [...prev, newFirecracker]);

      setTimeout(() => {
        setFirecrackers(prev => prev.filter(f => f.id !== id));
      }, 1000);
    };

    // Create firecrackers periodically
    const interval = setInterval(createFirecracker, 1500);
    createFirecracker();

    // Stop after 30 seconds
    setTimeout(() => {
      clearInterval(interval);
      // Hide effect after animation completes
      setTimeout(() => setIsVisible(false), 5000);
    }, 30000);
  };

  if (!isVisible) return null;

  return (
    <div className={styles.newYearContainer}>
      {/* Falling words */}
      {items.map((item) => (
        <div
          key={item.id}
          className={styles.fallingWord}
          style={{
            left: `${item.left}%`,
            animationDuration: `${item.animationDuration}s`,
            animationDelay: `${item.animationDelay}s`,
            color: item.color,
            fontSize: `${item.fontSize}px`,
            transform: `rotate(${item.rotation}deg)`,
          }}
        >
          {item.text}
        </div>
      ))}

      {/* Firecrackers */}
      {firecrackers.map((fc) => (
        <div
          key={fc.id}
          className={styles.firecracker}
          style={{
            left: `${fc.left}%`,
            top: `${fc.top}%`,
            "--fc-color": fc.color,
          }}
        >
          <div className={styles.burst}>
            {[...Array(8)].map((_, i) => (
              <span key={i} className={styles.spark} style={{ transform: `rotate(${i * 45}deg)` }} />
            ))}
          </div>
          <span className={styles.boom}>💥</span>
        </div>
      ))}
    </div>
  );
};

export default NewYearEffect;
