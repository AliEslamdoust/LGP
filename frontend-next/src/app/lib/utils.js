// Copyright (c) 2025 Ali Eslamdoust
// MIT License

"use client";

const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL;

/**
 * Asynchronously checks the user's authentication status by making a request to the backend.
 *
 * @returns {Promise<boolean>} - A promise that resolves to `true` if the user is authenticated,
 * and `false` otherwise.
 */

export async function CheckAuth() {
  try {
    const response = await fetch(`${backendUrl}/api/auth/check-auth`, {
      credentials: "include", // Include cookies in the request to maintain session
    });

    if (!response.ok) {
      return { success: false };
    }

    const data = await response.json();

    if (!data || !data.success) {
      return { success: false };
    }

    return data;
  } catch (err) {
    return { success: false };
  }
}

export function LargestBit(data) {
  if (!data) return 0;

  // Helper to find largest value for scaling
  function findLargestData(originalData) {
    let dataArray = [...originalData];
    if (!Array.isArray(dataArray) || dataArray.length === 0) {
      return 0;
    }

    let largestBit = 0;

    for (const item of dataArray) {
      if (item && item.up && !isNaN(+item.up)) {
        largestBit = Math.max(largestBit, +item.up);
      }
      if (item && item.down && !isNaN(+item.down)) {
        largestBit = Math.max(largestBit, +item.down);
      }
    }

    return largestBit;
  }

  // Helper function to round up maximum usage for chart scaling
  function roundUpMaxUsage(value) {
    let power = Math.ceil(Math.log10(value));
    let top = Math.pow(10, power);
    let max = top * 1.024;

    let ratio = value % top;

    if (value <= 100) {
      max = 100;
    } else if (ratio < top / 2 && ratio != 0) {
      let i = 1;
      let isLessThanMax = true;
      while (isLessThanMax) {
        max = (top / 10) * i * 1.024;
        if (value <= max) {
          isLessThanMax = false;
        }
        i++;
      }
    }

    return max;
  }

  let sortData = findLargestData(data);
  let getMaxValue = roundUpMaxUsage(sortData);

  return getMaxValue;
}
