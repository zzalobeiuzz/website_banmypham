import "@fortawesome/fontawesome-free/css/all.min.css";
import React from 'react';
import ReactDOM from 'react-dom/client';
import 'react-quill/dist/quill.snow.css';
import { BrowserRouter } from "react-router-dom";
import RouterCustom from './router';
import GlobalAlertPopup, { installGlobalAlertPopup } from './components/GlobalAlertPopup';
import './styles/style.scss';

installGlobalAlertPopup();

const root = ReactDOM.createRoot(document.getElementById('root'));

root.render(
  <BrowserRouter>
    <RouterCustom />
    <GlobalAlertPopup />
  </BrowserRouter>
);
