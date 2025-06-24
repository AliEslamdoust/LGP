// Copyright (c) 2025 Ali Eslamdoust
// MIT License

"use client";

import { useEffect, useRef, useState } from "react";

// Helper function to get the system's preferred color scheme
function getSystemColorScheme() {
  if (window.matchMedia) {
    if (window.matchMedia("(prefers-color-scheme: dark)").matches) {
      return "dark";
    } else if (window.matchMedia("(prefers-color-scheme: light)").matches) {
      return "light";
    }
  }
  return "light"; // Default to light if media queries are not supported
}

function Darkmode({ isMenu }) {
  const darkmodeBtn = useRef(null);
  const [darkMode, setDarkMode] = useState(false);
  const [clicked, setClicked] = useState(false);

  // useEffect to set initial dark mode state
  useEffect(() => {
    const savedMode = localStorage.getItem("darkMode");

    if (savedMode) {
      setDarkMode(savedMode === "true"); // Use saved mode if available
    } else {
      setDarkMode(
        window.matchMedia &&
          window.matchMedia("(prefers-color-scheme: dark)").matches
      ); // Otherwise, use system preference
    }
  }, []);

  // Function to toggle dark mode
  const switchDarkMode = () => {
    setDarkMode(!darkMode);
    setClicked(true); // Track that user has clicked the button
  };

  // useEffect to apply dark mode class to the document and save to localStorage
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add("dark-mode");
    } else {
      document.documentElement.classList.remove("dark-mode");
    }

    if (clicked) localStorage.setItem("darkMode", darkMode); // Save to localStorage after click
  }, [darkMode, clicked]);

  // Render different UI based on whether it's in the menu or not
  if (!isMenu)
    return (
      <div
        className={
          "dark-mode-switch" +
          (darkMode ? "" : " active") +
          (clicked ? " clicked" : "")
        }
        ref={darkmodeBtn}
        onClick={switchDarkMode}
      >
        <span className={"moon " + (darkMode ? "hide" : "")}></span>
        <span className={"sun " + (darkMode ? "" : "hide")}></span>
      </div>
    );
  else
    return (
      <button type="button" onClick={switchDarkMode} ref={darkmodeBtn}>
        <i
          className={
            "dark-mode-switch menu " +
            (darkMode ? "" : " active") +
            (clicked ? " clicked" : "")
          }
          ref={darkmodeBtn}
          onClick={switchDarkMode}
        >
          <span className={"moon " + (darkMode ? "hide" : "")}></span>
          <span className={"sun " + (darkMode ? "" : "hide")}></span>
        </i>
        <span>{darkMode ? "Light Mode" : "Dark Mode"}</span>
      </button>
    );
}

export default Darkmode;
