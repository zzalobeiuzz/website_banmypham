import React, { useState } from "react";
import "./style.scss";

const LostPage = () => {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <div className="lost-page">
      <div className="hamburger-menu">
        <button
          className="burger"
          data-state={menuOpen ? "open" : "closed"}
          onClick={() => setMenuOpen(!menuOpen)}
        >
          <span></span>
          <span></span>
          <span></span>
        </button>
      </div>

      <nav data-state={menuOpen ? "open" : "closed"}>
        <ul>
          <li><a href="/">Home</a></li>
          <li><a href="/">Services</a></li>
          <li><a href="/">About</a></li>
          <li><a href="/">Contact</a></li>
        </ul>
      </nav>

      <main>
        <div className="container">
          <div className="row">
            <div className="col-md-6 align-self-center">
              {/* SVG thuần đặt ở đây */}
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 600">
                {/* Copy nguyên nội dung SVG tĩnh từ file gốc vào đây */}
                <g>
                  <circle cx="400" cy="300" r="200" stroke="#0E0620" strokeWidth="3" fill="none" />
                  <text x="400" y="310" textAnchor="middle" fontSize="50" fill="#0E0620">Lost</text>
                </g>
              </svg>
            </div>
            <div className="col-md-6 align-self-center text-content">
              <h1>404</h1>
              <h2>UH OH! You're lost.</h2>
              <p>
                The page you are looking for does not exist. How you got here is a mystery. But you can click the button below to go back to the homepage.
              </p>
              <button className="btn green">HOME</button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default LostPage;