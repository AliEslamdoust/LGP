// Copyright (c) 2025 Ali Eslamdoust
// MIT License

"use client";

import { useEffect, useState } from "react";
import Menu from "./components/sideMenu";
import Metrics from "./components/metrics";
import WithAuth from "./components/withAuth";

function Home() {
  const [tab, setTab] = useState("metric");
  const [tabContent, setTabContent] = useState(null);

  const handleClick = (item) => {
    setTab(item);
  };

  useEffect(() => {
    const tabComponents = {
      metric: <Metrics />,
    };

    setTabContent(tabComponents[tab] || null);
  }, [tab]);

  return (
    <div className="container">
      <Menu onMenuItemClick={handleClick} />
      <div className="tab-wrapper">
        <div className="chart-name">
          <h2>Server Status</h2>
        </div>
        {tabContent}
      </div>
    </div>
  );
}

export default WithAuth(Home);
