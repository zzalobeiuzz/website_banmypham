import React from "react";
import { useNavigate } from "react-router-dom";

const NotFoundPage = () => {
  const navigate = useNavigate();

  return (
    <div className="hamburger-menu">
      <button className="burger" data-state="closed">
        <span></span>
        <span></span>
        <span></span>
      </button>

      <nav data-state="closed">
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
            <a href=".">Contact</a>
          </li>
        </ul>
      </nav>

      <main>
        <div className="container">
          <div className="row">
            <div className="col-md-6 align-self-center">
              <svg
                version="1.1"
                xmlns="http://www.w3.org/2000/svg"
                xmlnsXlink="http://www.w3.org/1999/xlink"
                viewBox="0 0 800 600"
              >
                <g>
                  <defs>
                    <clipPath id="GlassClip">
                      <path d="M380.857,346.164c-1.247,4.651-4.668,8.421-9.196,10.06c-9.332,3.377-26.2,7.817-42.301,3.5
                        s-28.485-16.599-34.877-24.192c-3.101-3.684-4.177-8.66-2.93-13.311l7.453-27.798c0.756-2.82,3.181-4.868,6.088-5.13
                        c6.755-0.61,20.546-0.608,41.785,5.087s33.181,12.591,38.725,16.498c2.387,1.682,3.461,4.668,2.705,7.488L380.857,346.164z" />
                    </clipPath>
                    <clipPath id="cordClip">
                      <rect width="800" height="600" />
                    </clipPath>
                  </defs>
                  {/* Bạn giữ nguyên toàn bộ phần SVG children ở đây (gồm planet, stars, spaceman...) */}
                </g>
              </svg>
            </div>

            <div className="col-md-6 align-self-center">
              <h1>404</h1>
              <h2>UH OH! You're lost.</h2>
              <p>
                The page you are looking for does not exist.
                How you got here is a mystery. But you can click the button below
                to go back to the homepage.
              </p>
              <button
                className="btn green"
                onClick={() => navigate("/")}
              >
                HOME
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default NotFoundPage;
