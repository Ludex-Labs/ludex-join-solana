/* eslint-disable react-hooks/exhaustive-deps */
import { FC, useState } from "react";
import { Wallet } from "@ludex-labs/ludex-sdk-js/web3/solana/utils";
import { Connection, Transaction } from "@solana/web3.js";
import { SolanaWallet } from "@web3auth/solana-provider";
import { SafeEventEmitterProvider } from "@web3auth/base";
import RedeemIcon from "@mui/icons-material/Redeem";
import { toast } from "react-hot-toast";

// MUI
import { Box, Button, Typography } from "@mui/material";

export const Redeem: FC<{
  publicKey: string;
  provider: SafeEventEmitterProvider | null;
  wallet?: Wallet;
  isMainnet: boolean;
  connection: Connection;
  changeNetwork: (network: string) => void;
  redeem: string;
}> = (props) => {
  const {
    // publicKey,
    provider,
    // wallet,
    // isMainnet,
    connection,
    // changeNetwork,
    redeem,
  } = props;
  const [isLoading, setIsLoading] = useState<boolean>(false);

  //const sendTransaction = async (tx: Transaction) => {
  const sendTransaction = async (txString: string) => {
    if (!provider) return "";
    try {
      var tx = Transaction.from(Buffer.from(txString, "base64"));
      setIsLoading(true);
      const solanaWallet = new SolanaWallet(provider);
      tx = await solanaWallet.signTransaction(tx);
      const sig = await connection.sendRawTransaction(tx.serialize());
      return sig;
    } catch (error) {
      console.error(error);
      toast.error("Error sending transaction");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Box>
      <Typography variant={"h5"} sx={{ mb: 3.5 }}>
        Execute Transaction to Redeem
      </Typography>

      <Button
        disabled={isLoading}
        onClick={() => sendTransaction(redeem)}
        variant={"contained"}
        sx={{
          p: 5,
          width: "300px",
          backgroundColor: "#3eb718",
          fontFamily: "Rubik",
          textTransform: "none",
          boxShadow: "#3eb71870 0px 8px 16px 0px!important",
          fontSize: "1.2rem",
          "&:hover": {
            boxShadow: "none !important",
            backgroundColor: "#ff714f14",
          },
        }}
      >
        <RedeemIcon sx={{ mr: 2, fontSize: "30px" }} />
        Redeem
      </Button>
    </Box>
  );
};
