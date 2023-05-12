/* eslint-disable react-hooks/exhaustive-deps */
import { FC } from "react";
import { Box, Button, Divider } from "@mui/material";
import WalletIcon from "@mui/icons-material/Wallet";

export const Footer: FC<{
  viewWallet: boolean;
  setViewWallet: (viewWallet: boolean) => void;
}> = (props) => {
  const { viewWallet, setViewWallet } = props;

  return (
    <>
      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          width: "100%",
        }}
      >
        <Divider sx={{ mt: 2, mb: 0 }} variant="middle" />

        <Button
          sx={{
            minWidth: "250px",
            backgroundColor: "#ff714f",
            display: "flex",
            alignItems: "center",
            padding: "10px",
            borderRadius: "10px",
            marginTop: "1rem",
            maxWidth: "290px",
            height: "42.25px",
            boxShadow: "#ff714f3d 0px 8px 16px 0px !important",
            "&:hover": {
              boxShadow: "none !important",
            },
          }}
          onClick={() => setViewWallet(!viewWallet)}
        >
          {!viewWallet && <WalletIcon sx={{ width: "25px", height: "25px" }} />}
          <>
            <Box
              sx={{
                fontFamily: "Rubik",
                ml: viewWallet ? 0 : "5px",
                fontSize: "15px",
                fontWeight: 500,
                textTransform: "none",
              }}
            >
              {viewWallet ? "Back" : "Wallet"}
            </Box>
          </>
        </Button>
      </Box>

      <Box
        sx={{
          mt: 2,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
        }}
      >
        <Box
          sx={{
            mb: 1,
          }}
        >
          POWERED BY
        </Box>
        <img
          alt="solana"
          src="./assets/solana-title.svg"
          className="chain-container-1"
        />
      </Box>
    </>
  );
};
