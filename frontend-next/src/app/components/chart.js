// Copyright (c) 2025 Ali Eslamdoust
// MIT License

import React, { useEffect, useRef } from "react";
import { LargestBit } from "../lib/utils";

const ChartMaker = ({ data, partName }) => {
  const isDual =
    partName === "network" || partName === "disk" ? true : false; // Determines if it's a dual-line chart
  const svgRef = useRef(null);
  const pathRef = useRef(null);
  const secondPathRef = useRef(null); // Ref for the second line in dual-line charts
  const gridRef = useRef(null);
  // Data preprocessing: Ensures data is suitable for charting
  data.forEach((e, i) => {
    if (!isDual) {
      if (isNaN(e)) data[i] = 0; // Convert NaN values to 0 for single-line charts
    } else {
      // Handle network/disk data (which has 'up' and 'down' values)
      if (typeof e != typeof {}) {
        data[i] = { up: 0, down: 0 }; // Ensure object structure
        return;
      }

      if (isNaN(e.up)) data[i].up = 0; // Convert NaN to 0 for 'up'
      if (isNaN(e.down)) data[i].down = 0; // Convert NaN to 0 for 'down'
    }
  });

  // Function to create the chart grid
  const createGrid = () => {
    const svg = svgRef.current;
    if (!svg) return;

    // Remove any existing grid lines
    const existingGrids = svg.querySelectorAll(".grid-container");
    existingGrids.forEach((grid) => {
      svg.removeChild(grid);
    });

    let { height, width } = svg.getBoundingClientRect();

    // Create vertical and horizontal grid lines
    for (let i = 0; i <= 1; i++) {
      let jMax = i == 0 ? 21 : 11; // More vertical lines
      const grid = document.createElementNS("http://www.w3.org/2000/svg", "g");
      gridRef.current = grid;
      grid.classList.add("grid-container");

      for (let j = 0; j < jMax; j++) {
        let startY = i == 0 ? 0 : (height / jMax) * j;
        let startX = i == 0 ? (width / jMax) * j : 0;
        let endY = i == 0 ? height : (height / jMax) * j;
        let endX = i == 0 ? (width / jMax) * j : width;

        const line = document.createElementNS(
          "http://www.w3.org/2000/svg",
          "line"
        );

        line.setAttribute("x1", startX);
        line.setAttribute("y1", startY);
        line.setAttribute("x2", endX);
        line.setAttribute("y2", endY);
        line.classList.add("grid-line");
        grid.appendChild(line);
      }
      // Insert grid as the first child of the SVG to ensure it's in the background
      if (svg.firstChild) {
        svg.insertBefore(grid, svg.firstChild);
      } else {
        svg.appendChild(grid);
      }
    }
  };
  createGrid();

  // useEffect hook to handle chart rendering and updates
  useEffect(() => {
    if (!svgRef.current) {
      return;
    }

    const svg = svgRef.current;
    // Create the primary path if it doesn't exist
    if (!pathRef.current) {
      const path = document.createElementNS(
        "http://www.w3.org/2000/svg",
        "path"
      );
      svg.appendChild(path);
      pathRef.current = path;
    }

    // Handle the second path for dual-line charts (network/disk)
    if (isDual && !secondPathRef.current) {
      const newPath = document.createElementNS(
        "http://www.w3.org/2000/svg",
        "path"
      );
      svg.appendChild(newPath);
      secondPathRef.current = newPath;
    } else if (!isDual && secondPathRef.current) {
      // Remove the second path if it's no longer needed
      pathRef.current.classList.remove("download");
      secondPathRef.current.remove();
      secondPathRef.current = null;
    }

    // Function to update the chart path
    const updateChart = (dataType) => {
      if (!data) {
        return;
      }

      let max = 0;

      if (isDual) {
        max = LargestBit(data);
      }
      max = max === 0 ? 1 : max;

      const svg = svgRef.current;
      let path = dataType ? secondPathRef.current : pathRef.current; // Select the correct path
      if (isDual) path.classList.add(dataType ? dataType : "download"); // Apply class for styling

      if (!svg || !path || !data) {
        return;
      }

      let { height, width } = svg.getBoundingClientRect();
      let heightAspectRatio = height / 100;

      let breakPoints = 60; // Number of data points to display

      let columnsLength = width / breakPoints; // Width of each data point

      let startPoint = width - data.length * columnsLength; // Starting x-coordinate
      let pathData = `M ${startPoint} ${height}`; // Start at the bottom-left

      let i = data.length == breakPoints ? 0 : 1;

      // Iterate through the data to build the path
      for (i; i < breakPoints && i < data.length; i++) {
        let x = startPoint + columnsLength * i;
        let y = (1 - data[i]) * 100 * heightAspectRatio; // Calculate y for single

        if (isDual) {
          // Calculate y for dual lines (up or down)
          y = dataType ? max - data[i].up : max - +data[i].down;

          y *= height / max; // Scale y to the chart height
        }

        pathData += ` L ${x} ${y}`; // Add point to path
      }

      // Complete the path
      if (!isDual) {
        pathData +=
          data.length !== 0
            ? ` L ${width} ${
                (1 - data[data.length - 1]) * 100 * heightAspectRatio
              }`
            : "";

        let x = width;
        let y = height;
        pathData += ` L ${x} ${y} Z`; // Close path for single
      } else {
        let thisData = dataType
          ? +data[data.length - 1]?.up || 0
          : +data[data.length - 1]?.down || 0;

        let x = Math.max(0, width);
        let y = Math.max(0, (max - thisData) * (height / max));
        pathData += ` L ${x} ${y}`; //for dual
      }

      path.setAttribute("d", pathData); // Set the path data

      // Update the second line for dual charts
      if (isDual && !dataType) updateChart("upload");
    };

    updateChart(); // Initial update
  }, [data, isDual]); // Redraw when data or chart type changes

  return (
    <svg ref={svgRef} className="taskmanager-chart">
      {" "}
    </svg>
  );
};

export default ChartMaker;
