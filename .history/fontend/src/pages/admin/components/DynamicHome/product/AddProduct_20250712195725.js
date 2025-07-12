.form-add-product-wrapper {
  display: flex;
  flex-wrap: wrap;
  width: 100%;
  padding: 20px;

  .barcode-wrapper {
    width: 100%;
    margin-bottom: 20px;

    label {
      display: block;
      font-weight: bold;
      margin-bottom: 6px;
    }

    input {
      width: 100%;
      padding: 8px;
      border: 1px solid #ddd;
      border-radius: 4px;
    }
  }

  .left-panel {
    flex-basis: 35%;
    padding: 10px;

    img {
      max-width: 100%;
      margin-top: 10px;
      border: 1px solid #ccc;
      border-radius: 4px;
    }
  }

  .right-panel {
    flex-basis: 65%;
    padding: 10px;

    h2 {
      margin-top: 0;
    }

    .form-group {
      margin-bottom: 15px;

      label {
        display: block;
        margin-bottom: 5px;
        font-weight: 500;
      }

      input,
      textarea {
        width: 100%;
        padding: 8px;
        border: 1px solid #ccc;
        border-radius: 4px;
      }
    }

    .btn-primary {
      background-color: #007bff;
      color: #fff;
      padding: 10px 16px;
      border: none;
      border-radius: 4px;
      cursor: pointer;

      &:hover {
        background-color: #0056b3;
      }
    }
  }
}
