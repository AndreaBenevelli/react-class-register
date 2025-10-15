import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { LocalizationProvider } from "@mui/x-date-pickers";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";

import { LoadingSystem } from "./shared/loading/LoadingSystem";

import "./index.css";
import App from "./App.tsx";
import { ToastContainer } from "react-toastify";

createRoot(document.getElementById("root")!).render(
  <BrowserRouter>
      <LocalizationProvider dateAdapter={AdapterDayjs}>
        <LoadingSystem>
          <App/>
        </LoadingSystem>
        <ToastContainer />
      </LocalizationProvider>
  </BrowserRouter>
);
