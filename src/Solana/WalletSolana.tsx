/* eslint-disable react-hooks/exhaustive-deps */
import { FC, useEffect, useState } from "react";
import { toast } from "react-hot-toast";
import { NFTMint } from "./NFTMint";
import { Connection } from "@solana/web3.js";
import { SafeEventEmitterProvider } from "@web3auth/base";
import { Wallet } from "@ludex-labs/ludex-sdk-js/lib/web3/utils";
import { RPC, getTestSol, viewTokenAccounts, importToken } from "./RPC";

// MUI
import {
  Box,
  IconButton,
  Button,
  FormControl,
  InputLabel,
  OutlinedInput,
  InputAdornment,
  Typography,
  Dialog,
  DialogTitle,
  MenuItem,
  Select,
} from "@mui/material";
import RefreshIcon from "@mui/icons-material/Refresh";
import SendIcon from "@mui/icons-material/Send";
import NotesIcon from "@mui/icons-material/Notes";
import UploadIcon from "@mui/icons-material/Upload";
import CloseIcon from "@mui/icons-material/Close";

export const WalletSolana: FC<{
  provider: SafeEventEmitterProvider | null;
  publicKey: string;
  isMainnet: boolean;
  connection: Connection;
  wallet: Wallet | undefined;
  changeNetwork: (network: string) => void;
  logout: () => void;
}> = (props) => {
  const {
    provider,
    publicKey,
    isMainnet,
    connection,
    wallet,
    changeNetwork,
    logout,
  } = props;
  const [balanceFetched, setBalanceFetched] = useState(false);
  const [balance, setBalance] = useState(0);
  const [openMint, setOpenMint] = useState(false);
  const [openImportToken, setOpenImportToken] = useState(false);
  const [tokenToImport, setTokenToImport] = useState("");

  useEffect(() => {
    getBalance();
  }, []);

  const getBalance = async () => {
    if (!provider) {
      console.error("provider not initialized yet");
      return;
    }
    const rpc = new RPC(provider);
    const balance = await rpc.getBalance(connection);
    setBalance(parseInt(balance));
    setBalanceFetched(true);
  };

  return (
    <>
      <Typography variant={"h5"} sx={{ mb: 2 }}>
        Your Wallet
      </Typography>
      <FormControl fullWidth sx={{ width: "100%", mb: 2 }}>
        <InputLabel>Public Key</InputLabel>
        <OutlinedInput
          value={publicKey}
          label="Public Key"
          disabled
          endAdornment={
            <InputAdornment position="end">
              <Button
                variant="contained"
                onClick={() => {
                  window.open(
                    "https://solana.tor.us/wallet/transfer?instanceId=" +
                      publicKey,
                    "_blank",
                    "popup=true,height=600,width=400"
                  );
                }}
              >
                <SendIcon />
              </Button>
            </InputAdornment>
          }
          fullWidth
        />
      </FormControl>

      <FormControl fullWidth sx={{ width: "100%", mb: 2 }}>
        <InputLabel>Balance</InputLabel>
        <OutlinedInput
          value={balance / 1000000000 + " SOL"}
          label="Wallet"
          disabled
          endAdornment={
            <InputAdornment position="end">
              <Button
                variant="contained"
                disabled={balanceFetched}
                onClick={() => {
                  getBalance();
                }}
              >
                <RefreshIcon />
              </Button>
            </InputAdornment>
          }
          fullWidth
        />
      </FormControl>

      <FormControl fullWidth sx={{ mb: 3 }}>
        <InputLabel>Network</InputLabel>
        <Select
          value={isMainnet ? "mainnet" : "devnet"}
          label="Network"
          onChange={(e) =>
            e.target.value === "mainnet"
              ? changeNetwork("mainnet")
              : changeNetwork("devnet")
          }
        >
          <MenuItem value={"devnet"}>Devnet</MenuItem>
          <MenuItem value={"mainnet"}>Mainnet</MenuItem>
        </Select>
      </FormControl>

      <Box style={{ flexWrap: "wrap", margin: 5 }}>
        {isMainnet ? (
          <Button
            variant="contained"
            size="small"
            onClick={() => {
              window.open(
                "https://solana.tor.us/wallet/topup/moonpay?instanceId=" +
                  publicKey,
                "_blank",
                "popup=true,height=600,width=400"
              );
            }}
            style={{ margin: 5 }}
          >
            Top Up
          </Button>
        ) : (
          <Button
            variant="contained"
            size="small"
            onClick={() => getTestSol(publicKey)}
            style={{ margin: 5 }}
          >
            Get Test SOL
          </Button>
        )}

        <Button
          variant="contained"
          size="small"
          onClick={() => setOpenMint(!openMint)}
          sx={openMint ? { background: "#1a1f2e" } : {}}
          style={{ margin: 5 }}
        >
          Mint Test NFT
        </Button>

        <Button
          variant="contained"
          size="small"
          onClick={() => setOpenImportToken(!openImportToken)}
          sx={openImportToken ? { background: "#1a1f2e" } : {}}
          style={{ margin: 5 }}
        >
          SPL Tokens
        </Button>

        <Button
          variant="contained"
          size="small"
          onClick={() => logout()}
          style={{ margin: 5 }}
        >
          Logout
        </Button>
      </Box>

      <Dialog
        className="dark-dialog"
        onClose={() => setOpenImportToken(false)}
        open={openImportToken}
      >
        <DialogTitle sx={{ textAlign: "center" }}>SPL Tokens</DialogTitle>
        <Box>
          <FormControl fullWidth>
            <InputLabel>Import Token</InputLabel>
            <OutlinedInput
              value={tokenToImport}
              label="Import Token"
              onChange={(e) => setTokenToImport(e.target.value)}
              endAdornment={
                <InputAdornment position="end">
                  <IconButton
                    onClick={() => {
                      if (provider !== null) {
                        toast.success("Importing tokens!");
                        importToken(
                          provider,
                          publicKey,
                          connection,
                          tokenToImport
                        );
                      }
                    }}
                  >
                    <UploadIcon />
                  </IconButton>
                  <IconButton
                    onClick={() => {
                      if (provider !== null) {
                        toast.success("SPL Tokens logged to console!");
                        viewTokenAccounts(provider, publicKey, connection);
                      }
                    }}
                  >
                    <NotesIcon />
                  </IconButton>

                  <IconButton
                    onClick={() => {
                      setOpenImportToken(false);
                    }}
                  >
                    <CloseIcon />
                  </IconButton>
                </InputAdornment>
              }
              fullWidth
            />
          </FormControl>
        </Box>
      </Dialog>

      {connection !== null && (
        <NFTMint
          publicKey={publicKey}
          wallet={wallet}
          connection={connection}
          openMint={openMint}
          setOpenMint={setOpenMint}
        />
      )}
    </>
  );
};
