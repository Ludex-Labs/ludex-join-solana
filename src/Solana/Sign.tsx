/* eslint-disable react-hooks/exhaustive-deps */
import { FC, useState, useEffect } from "react";
import { toast } from "react-hot-toast";
import { Transaction, Keypair, Connection } from "@solana/web3.js";
import { SafeEventEmitterProvider } from "@web3auth/base";
import CreateIcon from "@mui/icons-material/Create";
import { Box, Button, Typography } from "@mui/material";
import { RPC } from "./RPC";

export const Sign: FC<{
  provider: SafeEventEmitterProvider | null;
  connection: Connection;
  tx: string;
  isMainnet: boolean;
  changeNetwork: (network: string) => void;
}> = (props) => {
  const { provider, connection, tx, isMainnet, changeNetwork } = props;
  const [isLoading, setIsLoading] = useState<boolean>(false);

  useEffect(() => {
    (async () => {
      const params = new URLSearchParams(window.location.search);
      const isMainnetParam = params.get("isMainnet");
      if (isMainnetParam === "true") changeNetwork("mainnet");
    })();
  }, []);

  const sign = async (txString: string) => {
    if (provider === null) return;
    await toast.promise(
      Promise.resolve(
        (async () => {
          try {
            setIsLoading(true);
            var tx = Transaction.from(Buffer.from(txString, "base64"));
            const rpc = new RPC(provider);
            const privateKey = await rpc.getPrivateKey();
            const privateKeyBytes = Buffer.from(privateKey, "hex");
            const keypair = Keypair.fromSecretKey(privateKeyBytes);
            tx.partialSign(keypair);
            const sig = await connection.sendRawTransaction(tx.serialize(), {
              skipPreflight: true,
            });
            setTimeout(() => {
              window.open(
                `https://solscan.io/tx/` +
                  sig +
                  `?cluster=${isMainnet ? "mainnet" : "devnet"}`,
                "_blank"
              );
            }, 1000);
            return;
          } catch (e) {
            throw e;
          } finally {
            setIsLoading(false);
          }
        })()
      ),
      {
        loading: "Signing...",
        success: "Transaction Signed!",
        error: "Transaction failed to sign...",
      }
    );
  };

  return (
    <Box>
      <Typography variant={"h5"} sx={{ mb: 1 }}>
        Sign Transaction
      </Typography>
      <Typography variant={"subtitle2"} sx={{ mb: 1, opacity: 0.5 }}>
        Note: Doesn't work with Phantom option
      </Typography>

      <Button
        disabled={isLoading}
        onClick={() => sign(tx)}
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
        <CreateIcon sx={{ mr: 1, fontSize: "30px" }} />
        Sign
      </Button>
    </Box>
  );
};
