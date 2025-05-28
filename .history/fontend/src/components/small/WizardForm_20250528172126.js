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

  const nextStep = () => setStep(step + 1);
  const prevStep = () => setStep(step - 1);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({ ...formData, [name]: type === "checkbox" ? checked : value });
  };

  return (
    <main className="m-auto p-4 mw-100">
      <div className="card registration-card">
        <div className="card-body">
          <h1 className="card-title">REGISTRATION</h1>
          <div id="wizard">
            <h3>Personal</h3>
            <section>
              <div className="form-group">
                <label htmlFor="username" className="sr-only">Username</label>
                <input type="text" name="username" id="username" className="form-control" placeholder="Username" required />
              </div>
              <div className="form-group">
                <label htmlFor="phoneNumber" className="sr-only">Phone Number</label>
                <input type="tel" name="phoneNumber" id="phoneNumber" className="form-control" placeholder="Phone number" />
              </div>
              <div className="form-group">
                <label htmlFor="location" className="sr-only">Location</label>
                <input type="text" name="location" id="location" className="form-control" placeholder="Location" />
              </div>
              <div className="form-group">
                <label htmlFor="zipcode" className="sr-only">Zipcode</label>
                <input type="text" name="zipcode" id="zipcode" className="form-control" placeholder="Zipcode" />
              </div>
            </section>
  
            <h3>Bank</h3>
            <section>
              <div className="form-group">
                <label htmlFor="cardNumber" className="sr-only">Card Number</label>
                <input type="text" name="cardNumber" id="cardNumber" className="form-control" placeholder="Card number" />
              </div>
              <div className="form-group">
                <label htmlFor="expiration" className="sr-only">Expiration</label>
                <input type="text" name="expiration" id="expiration" className="form-control" placeholder="Expiration" />
              </div>
              <div className="form-group">
                <label htmlFor="cvv" className="sr-only">CVV</label>
                <input type="text" name="cvv" id="cvv" className="form-control" placeholder="CVV" />
              </div>
              <div className="form-group">
                <label htmlFor="nameOnCard" className="sr-only">Name on card</label>
                <input type="text" name="nameOnCard" id="nameOnCard" className="form-control" placeholder="Name on card" />
              </div>
            </section>
  
            <h3>Confirm</h3>
            <section>
              <h6 className="font-weight-bold">User Details</h6>
              <p className="mb-0">Username: <span id="enteredUsername"></span></p>
              <p className="mb-0">Phone: <span id="enteredPhoneNumber"></span></p>
              <p className="mb-0">Location: <span id="enteredLocation"></span></p>
              <p>Zipcode: <span id="enteredZipcode"></span></p>
  
              <h6 className="font-weight-bold">Card Details</h6>
              <p className="mb-0">Card: <span id="enteredCard"></span></p>
              <p className="mb-0">Card expiration: <span id="cardExpiration"></span></p>
  
              <div className="form-check mt-4">
                <label className="form-check-label" htmlFor="termsAgreement">
                  <input
                    type="checkbox"
                    className="form-check-input"
                    name="termsAgreement"
                    id="termsAgreement"
                    value="termsAgreed"
                    defaultChecked
                  />
                  I agree to the terms and conditions
                </label>
              </div>
            </section>
          </div>
        </div>
      </div>
    </main>
  );
  
};

export default WizardForm;
