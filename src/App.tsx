import "./App.css";
import { Toaster } from "react-hot-toast";
import { Solana } from "./Solana/index";
import { Box } from "@mui/material";
// @ts-ignore
import StarfieldAnimation from "react-starfield-animation";

function App() {
  return (
    <Box className="app">
      <StarfieldAnimation
        style={{
          position: "absolute",
          width: "100%",
          height: "100%",
        }}
      />
      <Toaster />
      <Box className="container-page">
        <Solana />
      </Box>
    </Box>
  );
}

export default App;
