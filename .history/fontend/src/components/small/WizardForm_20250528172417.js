import React, { useState } from "react";
import "./style.scss";

const WizardForm = () => {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    username: "",
    phoneNumber: "",
    location: "",
    zipcode: "",
    cardNumber: "",
    expiration: "",
    cvv: "",
    nameOnCard: "",
    termsAgreement: true,
  });

  const nextStep = () => setStep((prev) => Math.min(prev + 1, 3));
  const prevStep = () => setStep((prev) => Math.max(prev - 1, 1));

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  return (
    <main className="m-auto p-4 mw-100">
      <div className="card registration-card">
        <div className="card-body">
          <h1 className="card-title">REGISTRATION</h1>
          <div id="wizard">
            {/* Step 1 - Personal */}
            {step === 1 && (
              <section>
                <h3>Personal</h3>
                <div className="form-group">
                  <label htmlFor="username" className="sr-only">Username</label>
                  <input
                    type="text"
                    name="username"
                    id="username"
                    className="form-control"
                    placeholder="Username"
                    required
                    value={formData.username}
                    onChange={handleChange}
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="phoneNumber" className="sr-only">Phone Number</label>
                  <input
                    type="tel"
                    name="phoneNumber"
                    id="phoneNumber"
                    className="form-control"
                    placeholder="Phone number"
                    value={formData.phoneNumber}
                    onChange={handleChange}
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="location" className="sr-only">Location</label>
                  <input
                    type="text"
                    name="location"
                    id="location"
                    className="form-control"
                    placeholder="Location"
                    value={formData.location}
                    onChange={handleChange}
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="zipcode" className="sr-only">Zipcode</label>
                  <input
                    type="text"
                    name="zipcode"
                    id="zipcode"
                    className="form-control"
                    placeholder="Zipcode"
                    value={formData.zipcode}
                    onChange={handleChange}
                  />
                </div>
              </section>
            )}

            {/* Step 2 - Bank */}
            {step === 2 && (
              <section>
                <h3>Bank</h3>
                <div className="form-group">
                  <label htmlFor="cardNumber" className="sr-only">Card Number</label>
                  <input
                    type="text"
                    name="cardNumber"
                    id="cardNumber"
                    className="form-control"
                    placeholder="Card number"
                    value={formData.cardNumber}
                    onChange={handleChange}
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="expiration" className="sr-only">Expiration</label>
                  <input
                    type="text"
                    name="expiration"
                    id="expiration"
                    className="form-control"
                    placeholder="Expiration"
                    value={formData.expiration}
                    onChange={handleChange}
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="cvv" className="sr-only">CVV</label>
                  <input
                    type="text"
                    name="cvv"
                    id="cvv"
                    className="form-control"
                    placeholder="CVV"
                    value={formData.cvv}
                    onChange={handleChange}
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="nameOnCard" className="sr-only">Name on card</label>
                  <input
                    type="text"
                    name="nameOnCard"
                    id="nameOnCard"
                    className="form-control"
                    placeholder="Name on card"
                    value={formData.nameOnCard}
                    onChange={handleChange}
                  />
                </div>
              </section>
            )}

            {/* Step 3 - Confirm */}
            {step === 3 && (
              <section>
                <h3>Confirm</h3>
                <h6 className="font-weight-bold">User Details</h6>
                <p className="mb-0">Username: <span>{formData.username}</span></p>
                <p className="mb-0">Phone: <span>{formData.phoneNumber}</span></p>
                <p className="mb-0">Location: <span>{formData.location}</span></p>
                <p>Zipcode: <span>{formData.zipcode}</span></p>

                <h6 className="font-weight-bold">Card Details</h6>
                <p className="mb-0">Card: <span>{formData.cardNumber}</span></p>
                <p className="mb-0">Card expiration: <span>{formData.expiration}</span></p>

                <div className="form-check mt-4">
                  <label className="form-check-label" htmlFor="termsAgreement">
                    <input
                      type="checkbox"
                      className="form-check-input"
                      name="termsAgreement"
                      id="termsAgreement"
                      checked={formData.termsAgreement}
                      onChange={handleChange}
                    />
                    I agree to the terms and conditions
                  </label>
                </div>
              </section>
            )}

            {/* Navigation buttons */}
            <div className="d-flex justify-content-between mt-4">
              {step > 1 && (
                <button className="btn btn-secondary" onClick={prevStep}>
                  Back
                </button>
              )}
              {step < 3 ? (
                <button className="btn btn-primary ml-auto" onClick={nextStep}>
                  Next
                </button>
              ) : (
                <button className="btn btn-success ml-auto" onClick={() => alert("Form submitted!")}>
                  Submit
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </main>
  );
};

export default WizardForm;
