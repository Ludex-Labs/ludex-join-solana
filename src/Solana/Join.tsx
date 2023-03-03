/* eslint-disable react-hooks/exhaustive-deps */
import { FC, useEffect, useState } from "react";
import { toast } from "react-hot-toast";
import { Challenge } from "@ludex-labs/ludex-sdk-js";
import { Wallet } from "@ludex-labs/ludex-sdk-js/lib/web3/utils";
import { Connection, Transaction } from "@solana/web3.js";
import { SolanaWallet } from "@web3auth/solana-provider";
import { SafeEventEmitterProvider } from "@web3auth/base";
import { NFTJoin } from "./NFTJoin";

// MUI
import {
  Button,
  IconButton,
  Typography,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  OutlinedInput,
  InputAdornment,
  CircularProgress,
} from "@mui/material";
import DescriptionIcon from "@mui/icons-material/Description";
import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutline";

export const Join: FC<{
  publicKey: string;
  provider: SafeEventEmitterProvider | null;
  wallet?: Wallet;
  isMainnet: boolean;
  connection: Connection;
  changeNetwork: (network: string) => void;
}> = (props) => {
  const { publicKey, provider, wallet, isMainnet, connection, changeNetwork } =
    props;
  const [type, setType] = useState<string>("FT");
  const [joined, setJoined] = useState<boolean>(false);
  const [challengeAddress, setChallengeAddress] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [viewOfferings, setViewOfferings] = useState<boolean>(false);

  useEffect(() => {
    (async () => {
      const params = new URLSearchParams(window.location.search);
      const challengeType = params.get("type")?.toUpperCase();
      const isMainnetParam = params.get("isMainnet");
      const challengeAddress = params.get("c");
      if (challengeType !== undefined) setType(challengeType);
      if (isMainnetParam === "true") changeNetwork("mainnet");
      if (challengeAddress !== null) setChallengeAddress(challengeAddress);
    })();
  }, [publicKey]);

  const verifyError = (error: any, tx: Transaction) => {
    console.error(error);
    if (error?.includes("Blockhash not found")) {
      setTimeout(() => sendTransaction(tx), 2000);
    } else if (error?.includes("Error Code: ChallengeFull")) {
      toast.error("Challenge is already full.");
    } else if (error?.includes("already in use")) {
      toast.error("This address is already joined.");
      setJoined(true);
    } else if (error?.includes("no record of a prior credit")) {
      toast.error("You don't have enough credit.");
    } else if (error?.includes("User rejected the request")) {
      toast.error("Player rejected the request.");
    } else toast.error("Transaction failed.");
  };

  const sendTransaction = async (tx: Transaction) => {
    if (!provider) return "";
    try {
      setIsLoading(true);
      const solanaWallet = new SolanaWallet(provider);
      tx = await solanaWallet.signTransaction(tx);
      const sig = await connection.sendRawTransaction(tx.serialize());
      return sig;
    } catch (error) {
      let errorString = (error as any)?.logs
        ? error + " --- LOGS --- " + ((error as any)?.logs).toString()
        : error?.toString();
      verifyError(errorString, tx);
      return errorString ? errorString : "";
    } finally {
      setIsLoading(false);
    }
  };

  const joinFTChallenge = async () => {
    if (!wallet) return;
    try {
      const ludexTx = new Challenge.ChallengeTXClient(
        connection,
        challengeAddress,
        {
          wallet: wallet,
          cluster: isMainnet ? "MAINNET" : "DEVNET",
        }
      );
      const tx = await ludexTx.join(wallet.publicKey.toBase58()).getTx();
      const result = connection.getLatestBlockhash();
      tx.recentBlockhash = (await result).blockhash;
      const res = await sendTransaction(tx);
      if (!res.toString().includes("Error")) {
        setJoined(true);
        toast.success("Challenge joined!");
        console.info("sig: ", res);
      }
    } catch (error) {
      console.error(error);
      if (error?.toString().includes("Invalid account discriminator")) {
        toast.error("Join failed... challenge details invalid");
      } else if (error?.toString().includes("Error")) {
        toast.error("Join challenge failed");
      }
    }
  };

  const leaveFTChallenge = async () => {
    if (!wallet) return;
    try {
      const ludexTx = new Challenge.ChallengeTXClient(
        connection,
        challengeAddress,
        {
          wallet: wallet,
          cluster: isMainnet ? "MAINNET" : "DEVNET",
        }
      );
      const tx = await ludexTx.leave(wallet.publicKey.toBase58()).getTx();
      const result = connection.getLatestBlockhash();
      tx.recentBlockhash = (await result).blockhash;
      const res = await sendTransaction(tx);
      if (!res.toString().includes("Error")) {
        setJoined(true);
        toast.success("Challenge joined!");
        console.info("sig: ", res);
      }
    } catch (error) {
      console.error(error);
      if (error?.toString().includes("Error")) {
        toast.error("Join challenge failed");
      }
    }
  };

  return (
    <>
      {!viewOfferings && (
        <>
          <Typography variant={"h5"} sx={{ mb: 3.5 }}>
            Join Challenge
          </Typography>
          <FormControl
            disabled={isLoading}
            fullWidth
            sx={{ width: "100%", mb: 2 }}
          >
            <InputLabel>Challenge Address</InputLabel>
            <OutlinedInput
              onChange={(e) => setChallengeAddress(e.currentTarget.value)}
              value={challengeAddress}
              label="Challenge Address"
              disabled={joined}
              fullWidth
              endAdornment={
                <InputAdornment position="end">
                  <IconButton
                    disabled={challengeAddress === ""}
                    onClick={() =>
                      window.open(
                        "https://solscan.io/account/" +
                          challengeAddress +
                          `?cluster=${isMainnet ? "mainnet" : "devnet"}`,
                        "_blank"
                      )
                    }
                  >
                    <DescriptionIcon />
                  </IconButton>
                </InputAdornment>
              }
            />
          </FormControl>

          <FormControl size="small" fullWidth sx={{ mb: 2 }}>
            <InputLabel>Network</InputLabel>
            <Select
              value={isMainnet ? "mainnet" : "devnet"}
              disabled={joined || isLoading}
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

          <FormControl size="small" fullWidth sx={{ mb: 2 }}>
            <InputLabel>Type</InputLabel>
            <Select
              value={type === "FT" ? "FT" : "NFT"}
              disabled={joined || isLoading}
              label="Type"
              onChange={(e) =>
                e.target.value === "FT" ? setType("FT") : setType("NFT")
              }
            >
              <MenuItem value={"FT"}>Fungible Token</MenuItem>
              <MenuItem value={"NFT"}>Non-Fungible Token</MenuItem>
            </Select>
          </FormControl>
        </>
      )}

      {type === "FT" ? (
        <>
          <Button
            className="join-button"
            fullWidth
            variant="contained"
            size="large"
            disabled={isLoading || challengeAddress.length < 35 || joined}
            sx={{
              backgroundColor: "#3eb718",
              mt: 1,
              fontFamily: "Rubik",
              textTransform: "none",
              boxShadow: "#3eb71870 0px 8px 16px 0px!important",
              borderRadius: "8px !important",
              "&:hover": {
                boxShadow: "none !important",
                backgroundColor: "#ff714f14",
              },
            }}
            onClick={() => joinFTChallenge()}
          >
            {isLoading ? (
              <CircularProgress size={24} />
            ) : joined ? (
              <>
                <CheckCircleOutlineIcon sx={{ mr: 1 }} />
                Joined
              </>
            ) : (
              "Join"
            )}
          </Button>
          {joined && (
            <Button
              className="join-button"
              fullWidth
              variant="contained"
              size="large"
              disabled={isLoading || challengeAddress.length < 35}
              sx={{
                backgroundColor: "#3eb718",
                mt: 1,
                fontFamily: "Rubik",
                textTransform: "none",
                boxShadow: "#3eb71870 0px 8px 16px 0px!important",
                borderRadius: "8px !important",
                "&:hover": {
                  boxShadow: "none !important",
                  backgroundColor: "#ff714f14",
                },
              }}
              onClick={() => leaveFTChallenge()}
            >
              Leave
            </Button>
          )}
        </>
      ) : (
        <NFTJoin
          publicKey={publicKey}
          wallet={wallet}
          sendTransaction={sendTransaction}
          isMainnet={isMainnet}
          challengeAddress={challengeAddress}
          connection={connection}
          isLoading={isLoading}
          viewOfferings={viewOfferings}
          setViewOfferings={setViewOfferings}
        />
      )}
    </>
  );
};
