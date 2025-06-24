// Copyright (c) 2025 Ali Eslamdoust
// MIT License

"use client";

import { useEffect, useRef } from "react";

function Backdrop() {
  const contaienr = useRef(null); // Ref to the main container div

  useEffect(() => {
    if (!contaienr) return; // Exit if the container ref is not valid

    // Loop to create 75 dot wrappers and dots
    for (let i = 1; i <= 75; i++) {
      const newDotWrapper = document.createElement("div"); // Create a new div for each dot wrapper
      newDotWrapper.className = `dotWrapper dotWrapper-${i}`; // Assign class name for styling
      const newDot = document.createElement("div"); // Create a new div for each dot
      newDot.className = `dot dot-${i}`; // Assign class name for styling
      newDotWrapper.appendChild(newDot); // Append the dot to its wrapper
      contaienr.current.appendChild(newDotWrapper); // Append the wrapper to the main container
    }
  }, [contaienr]); // Dependency array: runs only once on mount as contaienr ref doesn't change

  return (
    <div className="backdrop-container">
      <div className="bg" ref={contaienr}></div> {/* Container div for the dots, referenced by contaienr */}
    </div>
  );
}

export default Backdrop;
