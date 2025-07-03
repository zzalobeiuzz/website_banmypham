import React, { useState, useEffect, useRef } from "react";
import "./style.scss";
import bodymovin from "lottie-web";
import animationData from "./animation.json";

const LostPage = () => {
  const [menuOpen, setMenuOpen] = useState(false);
  const svgRef = useRef(null);

  useEffect(() => {
    const anim = bodymovin.loadAnimation({
      container: svgRef.current,
      renderer: "svg",
      loop: true,
      autoplay: true,
      animationData: animationData,
    });

    return () => anim.destroy();
  }, []);

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
          <li>
            <a href="/">Home</a>
          </li>
          <li>
            <a href="/">Services</a>
          </li>
          <li>
            <a href="/">About</a>
          </li>
          <li>
            <a href="/">Contact</a>
          </li>
        </ul>
      </nav>

      <main>
        <div className="container">
          <div className="row">
            <div className="col-md-6 align-self-center">
              <div ref={svgRef} style={{ width: "100%", height: "100%" }} />
            </div>
            <div className="col-md-6 align-self-center text-content">
              <h1>404</h1>
              <h2>UH OH! You're lost.</h2>
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
