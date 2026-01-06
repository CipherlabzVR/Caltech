import React, { useEffect, useState, useMemo } from "react";
import Head from "next/head";
import styles from "./HolidayGreeting.module.css";
import BASE_URL from "Base/api";

const HolidayGreeting = () => {
  const [isVisible, setIsVisible] = useState(false);
  const [message, setMessage] = useState("");

  // Generate particles with random properties (mixed blue and gold)
  const particles = useMemo(() => {
    return Array.from({ length: 35 }, (_, i) => ({
      id: i,
      left: `${Math.random() * 100}%`,
      animationDelay: `${Math.random() * 8}s`,
      animationDuration: `${6 + Math.random() * 4}s`,
      size: 2 + Math.random() * 3,
      isGold: Math.random() > 0.5,
    }));
  }, []);

  // Star positions
  const stars = useMemo(() => [
    { top: "15%", left: "10%", delay: 3 },
    { top: "20%", right: "15%", delay: 3.5 },
    { top: "75%", left: "8%", delay: 4 },
    { top: "80%", right: "10%", delay: 4.5 },
    { top: "25%", left: "85%", delay: 5 },
    { top: "70%", left: "90%", delay: 5.5 },
  ], []);

  useEffect(() => {
    const fetchGreetingMessage = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) return;

        const justLoggedIn = sessionStorage.getItem("justLoggedIn");
        const alreadyShown = sessionStorage.getItem("holidayGreetingShown");

        if (alreadyShown && !justLoggedIn) return;

        sessionStorage.removeItem("justLoggedIn");

        const enabledResponse = await fetch(
          `${BASE_URL}/AppSetting/IsAppSettingEnabled?nameOrId=HolidayGreetingMessage`,
          {
            method: "GET",
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
          }
        );

        if (!enabledResponse.ok) return;
        const isEnabled = await enabledResponse.json();
        if (!isEnabled) return;

        const messageResponse = await fetch(
          `${BASE_URL}/AppSetting/GetAppSettingValueByName?settingName=HolidayGreetingMessage`,
          {
            method: "GET",
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
          }
        );

        if (messageResponse.ok) {
          const messageData = await messageResponse.text();
          if (messageData) {
            setMessage(messageData);
            setIsVisible(true);
            sessionStorage.setItem("holidayGreetingShown", "true");
          }
        }
      } catch (error) {
        // Silent fail - greeting is non-critical
      }
    };

    fetchGreetingMessage();
  }, []);

  // Auto-close after 10 seconds
  useEffect(() => {
    if (isVisible) {
      const autoCloseTimer = setTimeout(() => {
        setIsVisible(false);
      }, 10000);
      return () => clearTimeout(autoCloseTimer);
    }
  }, [isVisible]);

  const handleClose = () => {
    setIsVisible(false);
  };

  if (!isVisible || !message) return null;

  const currentYear = new Date().getFullYear().toString();

  return (
    <>
      <Head>
        <link
          href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;500;600&family=Inter:wght@300;400;500&display=swap"
          rel="stylesheet"
        />
      </Head>

      <div className={styles.overlay}>
        {/* Particles */}
        <div className={styles.particles}>
          {particles.map((p) => (
            <div
              key={p.id}
              className={`${styles.particle} ${p.isGold ? styles.particleGold : ""}`}
              style={{
                left: p.left,
                animationDelay: p.animationDelay,
                animationDuration: p.animationDuration,
                width: `${p.size}px`,
                height: `${p.size}px`,
              }}
            />
          ))}
        </div>

        {/* Ambient glows */}
        <div className={styles.glow}></div>
        <div className={styles.glowGold}></div>

        {/* Corner decorations */}
        <div className={`${styles.corner} ${styles.cornerTl}`}></div>
        <div className={`${styles.corner} ${styles.cornerTr}`}></div>
        <div className={`${styles.corner} ${styles.cornerBl}`}></div>
        <div className={`${styles.corner} ${styles.cornerBr}`}></div>

        {/* Stars */}
        {stars.map((star, i) => (
          <div
            key={i}
            className={styles.star}
            style={{
              top: star.top,
              left: star.left,
              right: star.right,
              animationDelay: `${star.delay}s`,
            }}
          >
            ✦
          </div>
        ))}

        {/* Close button */}
        <button className={styles.closeBtn} onClick={handleClose}>
          &times;
        </button>

        {/* Main content */}
        <div className={styles.greetingContainer}>
          <div className={styles.preHeading}>Welcome to</div>
          <div className={styles.brand}>
            <span className={styles.brandLetter}>C</span>
            <span className={styles.brandLetter}>B</span>
            <span className={styles.brandLetter}>A</span>
            <span className={styles.brandLetter}>S</span>
            <span className={styles.brandLetter}>S</span>
            <span className={`${styles.brandLetter} ${styles.dash}`}>-</span>
            <span className={`${styles.brandLetter} ${styles.highlight}`}>A</span>
            <span className={`${styles.brandLetter} ${styles.highlight}`}>I</span>
            <span className={styles.cursor}></span>
          </div>
          <div className={styles.byLine}>by Cal Tech Services Inc</div>
          <div className={styles.line}></div>

          <div className={styles.newYearSection}>
            <div className={styles.happyText}>{message}</div>
            <div className={styles.year}>
              {currentYear.split("").map((letter, index) => (
                <span key={index} className={styles.yearLetter}>
                  {letter}
                </span>
              ))}
            </div>
          </div>

          <div className={styles.lineGold}></div>
          <div className={styles.tagline}>Wishing you success & innovation</div>
        </div>

        {/* Timer bar */}
        <div className={styles.timerBar}></div>
      </div>
    </>
  );
};

export default HolidayGreeting;
