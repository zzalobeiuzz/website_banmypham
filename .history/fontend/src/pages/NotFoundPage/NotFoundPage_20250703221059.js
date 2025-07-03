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
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 600" style={{ width: "100%", height: "auto" }}>
                <g>
                  <circle cx="400" cy="300" r="100" fill="#0E0620" opacity="0.05" />
                  <circle cx="400" cy="300" r="70" fill="#FFFFFF" stroke="#0E0620" strokeWidth="5" />
                  <line x1="300" y1="300" x2="500" y2="300" stroke="#0E0620" strokeWidth="3" />
                  <line x1="400" y1="200" x2="400" y2="400" stroke="#0E0620" strokeWidth="3" />
                  <circle cx="380" cy="280" r="10" fill="#0E0620" />
                  <circle cx="420" cy="280" r="10" fill="#0E0620" />
                  <path d="M370 330 Q400 370 430 330" stroke="#0E0620" strokeWidth="5" fill="transparent" />
                </g>
              </svg>
            </div>
            <div className="col-md-6 align-self-center text-content">
              <h1>404</h1>
              <h2>UH OH! You&apos;re lost.</h2>
              <p>
                The page you are looking for does not exist. How you got here is
                a mystery. But you can click the button below to go back to the
                homepage.
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
