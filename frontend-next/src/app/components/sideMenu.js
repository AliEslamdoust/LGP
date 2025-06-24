// Copyright (c) 2025 Ali Eslamdoust
// MIT License

"use client";

import Darkmode from "./darkmode";
import { useRouter } from "next/navigation";
import { useState } from "react";
const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL;

function Menu({ onMenuItemClick }) {
  const [activeItem, setActiveItem] = useState("metric");
  const [menuOpen, setMenuOpen] = useState(false);
  const router = useRouter();
  const handleMenuItemClick = (item) => {
    setActiveItem(item);
    onMenuItemClick(item);
  };

  const handleLogout = () => {
    fetch(`${backendUrl}/api/auth/logout`, {
      credentials: "include",
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.success) router.push("/login");
      });
  };

  const handleMenuCollapse = () => {
    setMenuOpen(!menuOpen);
  };

  return (
    <div className={"side-menu" + (menuOpen ? "" : " collapse")}>
      <div className="menu-btns">
        <button onClick={handleMenuCollapse}>
          <div>
            <span></span>
          </div>
          <span>Collapse Menu</span>
        </button>
        <button
          type="button"
          className={activeItem === "metric" ? "active" : ""}
          onClick={() => {
            handleMenuItemClick("metric");
          }}
        >
          <i className="fa-solid fa-server"></i>
          <span>System Status</span>
        </button>
        <button type="button" onClick={handleLogout}>
          <i className="fa-solid fa-arrow-right-from-bracket"></i>
          <span>Log Out</span>
        </button>
        <Darkmode isMenu={true} />
      </div>
    </div>
  );
}

export default Menu;
