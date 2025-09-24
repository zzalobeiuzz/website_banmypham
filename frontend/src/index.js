import "@fortawesome/fontawesome-free/css/all.min.css";
import React from 'react';
import ReactDOM from 'react-dom/client';
import 'react-quill/dist/quill.snow.css';
import { BrowserRouter } from "react-router-dom";
import RouterCustom from './router';
import './styles/style.scss';


const root = ReactDOM.createRoot(document.getElementById('root'));

root.render(
  <BrowserRouter>
    <RouterCustom />

  </BrowserRouter>
);
