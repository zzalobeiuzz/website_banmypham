import React, { useState } from "react";
import "./";

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

  const nextStep = () => setStep(step + 1);
  const prevStep = () => setStep(step - 1);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({ ...formData, [name]: type === "checkbox" ? checked : value });
  };

  return (
    <div className="card border border-light-subtle rounded-4">
      <div className="card-body p-3 p-md-4 p-xl-5">
        {step === 1 && (
          <>
            <h5 className="mb-3">Step 1: Personal Info</h5>
            {["username", "phoneNumber", "location", "zipcode"].map((field) => (
              <div className="form-floating mb-3" key={field}>
                <input
                  type="text"
                  className="form-control"
                  name={field}
                  id={field}
                  value={formData[field]}
                  onChange={handleChange}
                  placeholder={field}
                />
                <label htmlFor={field}>{field}</label>
              </div>
            ))}
            <button className="btn btn-primary" onClick={nextStep}>
              Next
            </button>
          </>
        )}

        {step === 2 && (
          <>
            <h5 className="mb-3">Step 2: Card Info</h5>
            {["cardNumber", "expiration", "cvv", "nameOnCard"].map((field) => (
              <div className="form-floating mb-3" key={field}>
                <input
                  type="text"
                  className="form-control"
                  name={field}
                  id={field}
                  value={formData[field]}
                  onChange={handleChange}
                  placeholder={field}
                />
                <label htmlFor={field}>{field}</label>
              </div>
            ))}
            <div className="d-flex justify-content-between">
              <button className="btn btn-secondary" onClick={prevStep}>
                Back
              </button>
              <button className="btn btn-primary" onClick={nextStep}>
                Next
              </button>
            </div>
          </>
        )}

        {step === 3 && (
          <>
            <h5 className="mb-3">Step 3: Confirm</h5>
            <ul className="list-group mb-3">
              <li className="list-group-item">Username: {formData.username}</li>
              <li className="list-group-item">Phone: {formData.phoneNumber}</li>
              <li className="list-group-item">Location: {formData.location}</li>
              <li className="list-group-item">Zipcode: {formData.zipcode}</li>
              <li className="list-group-item">Card: {formData.cardNumber}</li>
              <li className="list-group-item">Expiration: {formData.expiration}</li>
            </ul>
            <div className="form-check mb-3">
              <input
                type="checkbox"
                className="form-check-input"
                name="termsAgreement"
                id="termsAgreement"
                checked={formData.termsAgreement}
                onChange={handleChange}
              />
              <label className="form-check-label" htmlFor="termsAgreement">
                I agree to the terms and conditions
              </label>
            </div>
            <div className="d-flex justify-content-between">
              <button className="btn btn-secondary" onClick={prevStep}>
                Back
              </button>
              <button className="btn btn-success">Submit</button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default WizardForm;
