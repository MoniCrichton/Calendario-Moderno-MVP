import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import "./index.css"; // O la ruta correcta según la estructur


ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App nivel="junta" />
  </React.StrictMode>
);
