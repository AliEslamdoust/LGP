// Copyright (c) 2025 Ali Eslamdoust
// MIT License

"use client";

import { useEffect, useRef, useState } from "react";
import Darkmode from "../components/darkmode";
import { useRouter } from "next/navigation";
import Link from "next/link";
import WithAuth from "../components/withAuth";
import Backdrop from "../components/backdrop";

function Register() {
  const [message, setMessage] = useState("");
  const [success, setSuccess] = useState(false);
  const usernameInput = useRef(null);
  const passwordInput = useRef(null);
  const rePasswordInput = useRef(null);
  const router = useRouter();

  const handleFormSubmit = (e) => {
    e.preventDefault();

    // Check if passwords match
    if (passwordInput.current.value !== rePasswordInput.current.value) {
      setSuccess(false);
      setMessage("Passwords don't match.");
      return;
    }

    fetch("http://127.0.0.1:3013/api/auth/register-owner", {
      method: "POST",
      body: JSON.stringify({
        username: usernameInput.current.value,
        password: passwordInput.current.value,
      }),
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include",
    })
      .then((res) => res.json())
      .then((data) => {
        setSuccess(data.success);
        setMessage(data.message);
      })
      .catch((err) => {
        setMessage("There was an error. Please try again.");
        console.error(err);
      });
  };

  useEffect(() => {
    if (success) {
      router.push("/"); // Redirect to home page after successful registration
    }
  }, [success, router]);

  return (
    <div className="login-container">
      <Backdrop />
      <div className="form-container">
        <h2>Sign Up Owner</h2>
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
            <input type="text" ref={usernameInput} />
          </div>
          <div className="input-container">
            <label>Password:</label>
            <input
              type="password"
              autoComplete="new-password"
              ref={passwordInput}
            />
          </div>
          <div className="input-container">
            <label>Re-Type Password:</label>
            <input
              type="password"
              autoComplete="new-password"
              ref={rePasswordInput}
            />
          </div>
          <button type="submit">Sign Up</button>
          <Link href="/login">Login Instead</Link>
        </form>
      </div>
      <Darkmode />
    </div>
  );
}

export default WithAuth(Register);
