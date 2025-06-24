// Copyright (c) 2025 Ali Eslamdoust
// MIT License

import Darkmode from "./darkmode";

function Loading() {
  return (
    <div className="loading-wrapper">
      <div className="loading-container">
      <span className="loader"></span>
        <span>Loading, Please wait.</span>
      </div>
      <Darkmode />
    </div>
  );
}

export default Loading();
