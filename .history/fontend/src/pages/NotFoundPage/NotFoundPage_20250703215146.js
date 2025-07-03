import React, { useState, useEffect, useRef } from "react";
import "./lostPage.scss";

const LostPage = () => {
  const [menuOpen, setMenuOpen] = useState(false);
  const svgRef = useRef(null);

  useEffect(() => {
    // ✅ Nếu bạn muốn chạy bodymovin animation
    // import animationData from './animation.json';
    // const anim = bodymovin.loadAnimation({
    //   container: svgRef.current,
    //   renderer: 'svg',
    //   loop: true,
    //   autoplay: true,
    //   animationData: animationData
    // });
    // return () => anim.destroy();
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
            <a href="#">Home</a>
          </li>
          <li>
            <a href="#">Services</a>
          </li>
          <li>
            <a href="#">About</a>
          </li>
          <li>
            <a href="#">Contact</a>
          </li>
        </ul>
      </nav>

      <main>
        <div className="container">
          <div className="row">
            <div className="col-md-6 align-self-center">
              {/* SVG có thể gắn vào đây */}
              <svg
                ref={svgRef}
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 800 600"
              >
                {/* Bạn copy nguyên phần <g> bên trong SVG ở HTML gốc vào đây */}
              </svg>
            </div>
            <div className="col-md-6 align-self-center text-content">
              <h1>404</h1>
              <h2>UH OH! You're lost.</h2>
              <p>
                The page you are looking for does not exist.
                How you got here is a mystery. But you can click the button below
                to go back to the homepage.
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
