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
    <main class="m-auto p-4 mw-100">
    <div class="card registration-card">
      <div class="card-body">
        <h1 class="card-title">REGISTRATION</h1>
        <div id="wizard">
          <h3>Personal</h3>
          <section>
            <div class="form-group">
              <label for="username" class="sr-only">Username</label>
              <input type="text" name="username" id="username" class="form-control" placeholder="Username" required>
            </div>
            <div class="form-group">
              <label for="phoneNumber" class="sr-only">Phone Number</label>
              <input type="tel" name="phoneNumber" id="phoneNumber" class="form-control" placeholder="Phone number">
            </div>
            <div class="form-group">
              <label for="location" class="sr-only">Location</label>
              <input type="text" name="location" id="location" class="form-control" placeholder="Location">
            </div>
            <div class="form-group">
              <label for="zipcode" class="sr-only">Zipcode</label>
              <input type="text" name="zipcode" id="zipcode" class="form-control" placeholder="Zipcode">
            </div>
          </section>
          <h3>Bank</h3>
          <section>
            <div class="form-group">
              <label for="cardNumber" class="sr-only">card Number</label>
              <input type="text" name="cardNumber" id="cardNumber" class="form-control" placeholder="Card number">
            </div>
            <div class="form-group">
              <label for="expiration" class="sr-only">Expiration</label>
              <input type="text" name="expiration" id="expiration" class="form-control" placeholder="Expiration">
            </div>
            <div class="form-group">
              <label for="cvv" class="sr-only">CVV</label>
              <input type="text" name="cvv" id="cvv" class="form-control" placeholder="CVV">
            </div>
            <div class="form-group">
              <label for="nameOnCard" class="sr-only">Name on card</label>
              <input type="text" name="nameOnCard" id="nameOnCard" class="form-control" placeholder="Name on card">
            </div>
          </section>
          <h3>Confirm</h3>
          <section>
            <h6 class="font-weight-bold"> User Details</h6>
            <p class="mb-0">Username : <span id="enteredUsername"></span> </p>
            <p class="mb-0">Phone : <span id="enteredPhoneNumber"></span> </p>
            <p class="mb-0">Location : <span id="enteredLocation"></span> </p>
            <p>Zipcode : <span id="enteredZipcode"></span> </p>
            <h6 class="font-weight-bold"> Card Details</h6>
            <p class="mb-0">card : <span id="enteredCard"></span> </p>
            <p class="mb-0">Card expiration : <span id="cardExpiration"></span> </p>
            <div class="form-check mt-4">
              <label class="form-check-label">
                <input type="checkbox" class="form-check-input" name="termsAgreement" id="termsAgreement" value="termsAgreed" checked>
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
