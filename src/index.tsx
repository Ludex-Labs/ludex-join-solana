import ReactDOM from "react-dom/client";
import App from "./App";
import { Buffer } from "buffer";
import { ThemeProvider, createTheme } from "@mui/material/styles";
import CssBaseline from "@mui/material/CssBaseline";

const darkTheme = createTheme({
  palette: {
    primary: {
      main: "#ff714f",
    },
    secondary: {
      main: "#edf2ff",
    },
    mode: "dark",
  },
});

// @ts-ignore
window.Buffer = Buffer;

const root = ReactDOM.createRoot(
  document.getElementById("root") as HTMLElement
);

root.render(
  <ThemeProvider theme={darkTheme}>
    <CssBaseline />
    <App />
  </ThemeProvider>
);
