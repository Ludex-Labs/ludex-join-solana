/* eslint-disable react-hooks/exhaustive-deps */
import { FC, useState, useEffect } from "react";
import { Wallet } from "@ludex-labs/ludex-sdk-js/web3/solana/utils";
import { Transaction, Keypair } from "@solana/web3.js";
import { SafeEventEmitterProvider } from "@web3auth/base";
import AddIcon from "@mui/icons-material/Add";
import { toast } from "react-hot-toast";
import * as anchor from "@project-serum/anchor";
import { Box, Button, Typography } from "@mui/material";
import { RPC } from "./RPC";

export const Redeem: FC<{
  provider: SafeEventEmitterProvider | null;
  wallet?: Wallet;
  changeNetwork: (network: string) => void;
  connection: anchor.web3.Connection;
  redeem: string;
}> = (props) => {
  const { provider, connection, changeNetwork, redeem } = props;
  const [isLoading, setIsLoading] = useState<boolean>(false);

  useEffect(() => {
    (async () => {
      const params = new URLSearchParams(window.location.search);
      const isMainnetParam = params.get("isMainnet");
      if (isMainnetParam === "true") changeNetwork("mainnet");
    })();
  }, []);

  const sendTransaction = async (txString: string) => {
    if (!provider) return "";
    try {
      setIsLoading(true);
      if (provider === null) return;
      var tx = Transaction.from(Buffer.from(txString, "base64"));
      const rpc = new RPC(provider);
      const privateKey = await rpc.getPrivateKey();
      const privateKeyBytes = Buffer.from(privateKey, "hex");
      const keypair = Keypair.fromSecretKey(privateKeyBytes);
      tx.partialSign(keypair);
      const sig = await connection.sendRawTransaction(tx.serialize(), {
        skipPreflight: true,
      });

      console.log("sig", sig);
      toast.success("Reddemed Successfully!");
      return;
    } catch (error) {
      console.error(error);
      toast.error("Error sending transaction");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Box>
      <Typography variant={"h5"} sx={{ mb: 1 }}>
        Redeem
      </Typography>
      <Typography variant={"subtitle2"} sx={{ mb: 1 }}>
        Note: Doesn't work with Phantom Wallet
      </Typography>

      <Button
        disabled={isLoading}
        onClick={() => sendTransaction(redeem)}
        variant={"contained"}
        sx={{
          mt: 2,
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
        <AddIcon sx={{ mr: 2, fontSize: "30px" }} />
        Redeem
      </Button>
    </Box>
  );
};
