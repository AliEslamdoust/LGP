// Copyright (c) 2025 Ali Eslamdoust
// MIT License

"use client";

import { useEffect, useRef, useState } from "react";
import Darkmode from "../components/darkmode";
import Backdrop from "../components/backdrop";
import { useRouter } from "next/navigation";
import { CheckAuth } from "../lib/utils";
const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL;

export default function Login() {
  const [message, setMessage] = useState("");
  const [success, setSuccess] = useState(false);
  const [redirect, setRedirect] = useState(false);
  const usernameInput = useRef(null);
  const passwordInput = useRef(null);
  const router = useRouter();

  useEffect(() => {
    // Check authentication on component mount to handle auto-login
    const userAuth = async () => {
      let authRes = await CheckAuth();

      setRedirect(authRes.id === "owner"); // Set redirect flag if user is owner (for registration)
      setSuccess(authRes.success); // Set success flag based on authentication check
    };
  }, []);

  const handleFormSubmit = (e) => {
    e.preventDefault();

    fetch(`${backendUrl}/api/auth/login`, {
      method: "POST",
      body: JSON.stringify({
        username: usernameInput.current.value,
        password: passwordInput.current.value,
      }),
      headers: { "Content-Type": "application/json" },
      credentials: "include",
    })
      .then((res) => res.json())
      .then((data) => {
        setMessage(data.message);
        setRedirect(data.redirect);
        setSuccess(data.success);
      })
      .catch((err) => {
        setMessage("There was an error. Please try again.");
      });
  };

  useEffect(() => {
    // Redirect user after successful login
    if (success) {
      if (redirect) {
        router.push("/register"); // Redirect to registration for owner
      } else {
        router.push("/"); // Redirect to home page for other users
      }
    }
  }, [success, redirect, router]);

  return (
    <div className="login-container">
      <Backdrop />
      <div className="form-container">
        <h2>Login</h2>
        <div className="login-result">
          {(() => {
            if (success) {
              return <span className="success">{message}</span>;
            } else {
              return <span className="error">{message}</span>;
            }
          })()}
        </div>
        <form onSubmit={handleFormSubmit}>
          <div className="input-container">
            <label>Username:</label>
            <input type="text" autoComplete="username" ref={usernameInput} />
          </div>
          <div className="input-container">
            <label>Password:</label>
            <input
              type="password"
              autoComplete="current-password"
              ref={passwordInput}
            />
          </div>
          <button type="submit">Submit</button>
        </form>
      </div>
      <Darkmode />
    </div>
  );
}
