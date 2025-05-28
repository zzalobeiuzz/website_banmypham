import React from "react";
import "../components/auth.scss";

const Signup = () => {
  return (
    <section className="sign-up">
      <div className="container">
        <div className="row justify-content-end me-3">
          <div className="welcome col-12  col-md-9 col-lg-7 col-xl-6 col-xxl-6 mt-5">
            <div className="text-center mb-4">
              <a href="./" >
                <img
                  src="./assets/images/logo-removebg.png"
                  alt="BootstrapBrain Logo"
                  className="mb-5" 
                />
              </a>
              <h3 className="mb-4 h3">Đăng kí ngay để được</h3>
              <ul>
                <li>
                  {" "}
                  <img
                    src="./assets/icons/icons8-tick.gif"
                    alt="icon"
                    width={16}
                    style={{ marginRight: "8px" }}
                  />
                  Tư vấn chuyên sâu miễn phí
                </li>
                <li>
                  {" "}
                  <img
                    src="/assets/icons/icons8-tick.gif"
                    alt="icon"
                    width={16}
                    style={{ marginRight: "8px" }}
                  />
                  Các ưu đãi mừng đăng kí
                </li>
                <li>
                  {" "}
                  <img
                    src="/assets/icons/icons8-tick.gif"
                    alt="icon"
                    width={16}
                    style={{ marginRight: "8px" }}
                  />
                  Tham gia các sự kiện khuyến mãi của </br>chúng tôi
                </li>
              </ul>
            </div>
          </div>
          <div className="form-signup col-12 col-md-9 col-lg-7 col-xl-6 col-xxl-6">
            <div className="card border border-light-subtle rounded-4">
              <div className="card-body p-3 p-md-4 p-xl-5">
                <div className="row">
                  <div className="col-12">
                    <div className="mb-5">
                      <h2 className="h4 text-center">Registration</h2>
                      <h3 className="fs-6 fw-normal text-secondary text-center m-0">
                        Enter your details to register
                      </h3>
                    </div>
                  </div>
                </div>

                <form action="#!">
                  <div className="row gy-3 overflow-hidden">
                    <div className="col-12">
                      <div className="form-floating mb-3">
                        <input
                          type="text"
                          className="form-control"
                          name="firstName"
                          id="firstName"
                          placeholder="First Name"
                          required
                        />
                        <label htmlFor="firstName" className="form-label">
                          First Name
                        </label>
                      </div>
                    </div>

                    <div className="col-12">
                      <div className="form-floating mb-3">
                        <input
                          type="text"
                          className="form-control"
                          name="lastName"
                          id="lastName"
                          placeholder="Last Name"
                          required
                        />
                        <label htmlFor="lastName" className="form-label">
                          Last Name
                        </label>
                      </div>
                    </div>

                    <div className="col-12">
                      <div className="form-floating mb-3">
                        <input
                          type="email"
                          className="form-control"
                          name="email"
                          id="email"
                          placeholder="name@example.com"
                          required
                        />
                        <label htmlFor="email" className="form-label">
                          Email
                        </label>
                      </div>
                    </div>

                    <div className="col-12">
                      <div className="form-floating mb-3">
                        <input
                          type="password"
                          className="form-control"
                          name="password"
                          id="password"
                          placeholder="Password"
                          required
                        />
                        <label htmlFor="password" className="form-label">
                          Password
                        </label>
                      </div>
                    </div>

                    <div className="col-12">
                      <div className="form-check">
                        <input
                          className="form-check-input"
                          type="checkbox"
                          name="iAgree"
                          id="iAgree"
                          required
                        />
                        <label
                          className="form-check-label text-secondary"
                          htmlFor="iAgree"
                        >
                          I agree to the{" "}
                          <a
                            href="#!"
                            className="link-primary text-decoration-none"
                          >
                            terms and conditions
                          </a>
                        </label>
                      </div>
                    </div>

                    <div className="col-12">
                      <div className="d-grid">
                        <button
                          className="btn bsb-btn-xl btn-primary"
                          type="submit"
                        >
                          Sign up
                        </button>
                      </div>
                    </div>
                  </div>
                </form>

                <div className="row">
                  <div className="col-12">
                    <hr className="mt-5 mb-4 border-secondary-subtle" />
                    <p className="m-0 text-secondary text-center">
                      Already have an account?{" "}
                      <a
                        href="#!"
                        className="link-primary text-decoration-none"
                      >
                        Sign in
                      </a>
                    </p>
                  </div>
                </div>

                <div className="row">
                  <div className="col-12">
                    <p className="mt-5 mb-5">Or continue with</p>
                    <div className="d-flex gap-2 gap-sm-3 justify-content-center">
                      {/* Google */}
                      <a
                        href="#!"
                        className="btn btn-lg btn-outline-danger p-3 lh-1"
                      >
                        <i className="fab fa-google fs-3" />
                      </a>
                      {/* Facebook */}
                      <a
                        href="#!"
                        className="btn btn-lg btn-outline-primary p-3 lh-1"
                      >
                        <i className="fab fa-facebook fs-3" />
                      </a>
                      {/* Twitter */}
                      <a
                        href="#!"
                        className="btn btn-lg btn-outline-info p-3 lh-1"
                      >
                        <i className="fab fa-twitter fs-3" />
                      </a>
                      {/* Apple */}
                      <a
                        href="#!"
                        className="btn btn-lg btn-outline-dark p-3 lh-1"
                      >
                        <i className="bi bi-apple fs-3" />
                      </a>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Signup;
