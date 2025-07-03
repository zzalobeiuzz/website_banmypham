import lottie from "lottie-web";
import React, { useEffect, useRef, useState } from "react";
import animationData from "./animation.json";
import "./style.scss";

const LostPage = () => {
  const [menuOpen, setMenuOpen] = useState(false);
  const container = useRef(null);
  const animationInstance = useRef(null);

  useEffect(() => {
    // Load animation
    animationInstance.current = lottie.loadAnimation({
      container: container.current,
      renderer: "svg",
      loop: true,
      autoplay: true,
      animationData: animationData
    });

    // Cleanup: destroy animation khi unmount hoặc trước khi load lại
    return () => {
      if (animationInstance.current) {
        animationInstance.current.destroy();
      }
    };
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
              <div ref={container} style={{ width: 700, height: 600 }}></div>
            </div>
            <div className="col-md-6 align-self-center text-content">
              <h1>404</h1>
              <h2>UH OH! You&apos;re lost.</h2>
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
