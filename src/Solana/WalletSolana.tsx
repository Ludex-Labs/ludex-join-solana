import { FC, useEffect, useState } from "react";
import { toast } from "react-hot-toast";
import { Wallet } from "@ludex-labs/ludex-sdk-js/web3/solana/utils";
import { Connection } from "@solana/web3.js";
import { SafeEventEmitterProvider } from "@web3auth/base";
import { NFTMint } from "./NFTMint";
import { getTestSol, importToken, RPC, viewTokenAccounts } from "./RPC";

// MUI
import {
  Box,
  Button,
  Dialog,
  DialogContent,
  DialogTitle,
  FormControl,
  IconButton,
  InputAdornment,
  InputLabel,
  MenuItem,
  OutlinedInput,
  Select,
  Typography,
} from "@mui/material";
import SettingsIcon from "@mui/icons-material/Settings";
import UploadIcon from "@mui/icons-material/Upload";

// Button Style
const buttonStyles = {
  height: "42px",
  textTransform: "none",
  fontFamily: "Rubik",
  boxShadow: "#9945ff2e 0px 8px 16px 0px !important",
  borderRadius: "8px !important",
  minWidth: "100% !important",
  background: "linear-gradient(90deg, #9945FF 0%, #14F195 100%) !important",
  transition: "all 0.3s ease 0s",
  "&:hover": {
    opacity: "0.5",
  },
};

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
  const [balance, setBalance] = useState<number | undefined>(undefined);
  const [openMint, setOpenMint] = useState(false);
  const [openSPLToken, setOpenSPLToken] = useState(false);
  const [tokenToImport, setTokenToImport] = useState("");
  const [tokenAccounts, setTokenAcccount] = useState<any>();

  const getBalance = async () => {
    if (!provider) {
      console.error("provider not initialized yet");
      return;
    }
    const rpc = new RPC(provider);
    const _balance = await rpc.getBalance(connection);
    if (_balance?.toString().includes("Error")) {
      toast.error("Error getting balance");
      setBalance(0);
      return;
    } else setBalance(parseInt(_balance) / 10 ** 9);
  };

  useEffect(() => {
    getBalance();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isMainnet]);

  const fetchTokenAccounts = async () => {
    if (provider === null) return;
    toast.success("SPL Tokens logged to console!");
    const tokenAccounts = await viewTokenAccounts(
      provider,
      publicKey,
      connection
    );
    console.info("tokenAccounts", tokenAccounts);
    setTokenAcccount(tokenAccounts);
  };

  console.log("tokenAccounts", tokenAccounts);

  return (
    <>
      <Typography variant={"h5"} sx={{ mb: 3.5 }}>
        Your Wallet
      </Typography>
      <FormControl size="small" fullWidth sx={{ width: "100%", mb: 2 }}>
        <InputLabel>Public Key</InputLabel>
        <OutlinedInput
          value={publicKey}
          label="Public Key"
          disabled
          endAdornment={
            <InputAdornment position="end">
              <IconButton
                onClick={() => {
                  window.open(
                    "https://solana.tor.us/wallet/transfer?instanceId=" +
                      publicKey,
                    "_blank",
                    "popup=true,height=600,width=400"
                  );
                }}
              >
                <SettingsIcon />
              </IconButton>
            </InputAdornment>
          }
          fullWidth
        />
      </FormControl>

      <FormControl size="small" fullWidth sx={{ width: "100%", mb: 2 }}>
        <InputLabel>Balance</InputLabel>
        <OutlinedInput
          value={balance?.toString() + " SOL"}
          label="Wallet"
          disabled
          fullWidth
        />
      </FormControl>

      <FormControl size="small" fullWidth sx={{ mb: 2 }}>
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

      <Box style={{ flexWrap: "wrap" }}>
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
            sx={{
              ...buttonStyles,
              mb: 2,
            }}
          >
            Top Up
          </Button>
        ) : (
          <Button
            variant="contained"
            size="small"
            onClick={async () => {
              await getTestSol(publicKey);
              getBalance();
            }}
            sx={{
              ...buttonStyles,
              mb: 2,
            }}
          >
            Get Test SOL
          </Button>
        )}

        <Button
          variant="contained"
          size="small"
          onClick={() => setOpenMint(!openMint)}
          sx={
            openMint
              ? {
                  ...buttonStyles,
                  mb: 2,
                }
              : {
                  ...buttonStyles,
                  mb: 2,
                }
          }
        >
          Mint Test NFT
        </Button>

        <Button
          variant="contained"
          size="small"
          onClick={() => {
            fetchTokenAccounts();
            setOpenSPLToken(!openSPLToken);
          }}
          sx={
            openSPLToken
              ? {
                  ...buttonStyles,
                }
              : {
                  ...buttonStyles,
                }
          }
        >
          SPL Tokens
        </Button>

        <Button
          sx={{
            minWidth: "100% !important",
            width: "100%",
            backgroundColor: "#e34d5a",
            display: "flex",
            alignItems: "center",
            padding: "10px",
            borderRadius: "10px",
            marginTop: "1rem",
            maxWidth: "290px",
            height: "42.25px",
            boxShadow: "#ff714f3d 0px 8px 16px 0px !important",
            textTransform: "none",
            fontWeight: "bold",
            "&:hover": {
              boxShadow: "none !important",
            },
          }}
          onClick={() => {
            logout();
          }}
        >
          Logout
        </Button>
      </Box>

      <Dialog
        className="dark-dialog"
        onClose={() => setOpenSPLToken(false)}
        open={openSPLToken}
      >
        <DialogTitle
          sx={{ textAlign: "center", fontFamily: "Rubik", fontWeight: 400 }}
        >
          SPL Tokens
        </DialogTitle>
        <DialogContent>
          <FormControl fullWidth>
            <InputLabel>Import Token</InputLabel>
            <OutlinedInput
              value={tokenToImport}
              label="Import Token"
              onChange={(e) => setTokenToImport(e.target.value)}
              fullWidth
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
                </InputAdornment>
              }
            />

            <Box
              sx={{
                display: "flex",
                flexDirection: "column",
                mt: 2,
                border: "1px solid #666d79",
                borderRadius: "5px",
                padding: "5px",
                overflow: "auto",
              }}
            >
              {tokenAccounts?.value &&
                tokenAccounts?.value?.length > 0 &&
                tokenAccounts?.value.map((token, index) => {
                  const amount =
                    token?.account?.data?.parsed?.info?.tokenAmount?.uiAmount;
                  const mint = token?.account?.data?.parsed?.info?.mint;

                  return (
                    <Box
                      sx={{
                        display: "flex",
                        alignItems: "center",
                      }}
                    >
                      <Typography
                        sx={{
                          fontFamily: "Rubik",
                          fontWeight: 400,
                          color: "#fff",
                          fontSize: "12px",
                          minWidth: "50px",
                          background: "#464f5d",
                          textAlign: "center",
                          marginRight: "5px",
                        }}
                      >
                        {amount}
                      </Typography>
                      <Typography
                        sx={{
                          fontFamily: "Rubik",
                          fontWeight: 400,
                          color: "#fff",
                          fontSize: "12px",
                          textAlign: "left",
                        }}
                      >
                        {mint}
                      </Typography>
                    </Box>
                  );
                })}
            </Box>
          </FormControl>
        </DialogContent>
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
