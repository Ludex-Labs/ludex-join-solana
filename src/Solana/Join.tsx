/* eslint-disable react-hooks/exhaustive-deps */
import { FC, useEffect, useState } from "react";
import { toast } from "react-hot-toast";
import { Challenge } from "@ludex-labs/ludex-sdk-js";
import { Wallet } from "@ludex-labs/ludex-sdk-js/web3/solana/utils";
import {
  getChallengeInfo,
  Challenge as _Challenge,
} from "@ludex-labs/ludex-sdk-js/web3/solana/challenge/client";
import { Connection, Transaction } from "@solana/web3.js";
import { SolanaWallet } from "@web3auth/solana-provider";
import { SafeEventEmitterProvider } from "@web3auth/base";
import { NFTJoin } from "./NFTJoin";
import { Exchange } from "./Exchange";

// MUI
import {
  Box,
  Button,
  Typography,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  OutlinedInput,
  CircularProgress,
} from "@mui/material";
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
  const [challenge, setChallenge] = useState<_Challenge | undefined>(undefined);
  const [isExchange, setIsExchange] = useState<boolean>(false);

  useEffect(() => {
    (async () => {
      const params = new URLSearchParams(window.location.search);
      const challengeType = params.get("type")?.toUpperCase();
      const isMainnetParam = params.get("isMainnet");
      const challengeAddress = params.get("c");
      const exchangeParam = params.get("isExchange");
      if (challengeType !== undefined) setType(challengeType);
      if (isMainnetParam === "true") changeNetwork("mainnet");
      if (challengeAddress !== null) setChallengeAddress(challengeAddress);
      if (exchangeParam === "true") setIsExchange(true);
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
        setJoined(false);
        toast.success("Challenge left!");
        console.info("sig: ", res);
      }
    } catch (error) {
      console.error(error);
      if (error?.toString().includes("Error")) {
        toast.error("Leave challenge failed");
      }
    }
  };

  const fetchChallengeDetails = async () => {
    const challengeDetails = await getChallengeInfo(
      connection,
      challengeAddress,
      {
        wallet: wallet,
        cluster: isMainnet ? "MAINNET" : "DEVNET",
      }
    );
    toast.success("Fetching challenge details...");
    setChallenge(challengeDetails);
  };

  return (
    <Box
      sx={{
        minWidth: "350px",
      }}
    >
      {!viewOfferings && (
        <>
          <Typography variant={"h5"} sx={{ mb: 3.5 }}>
            Join {isExchange ? "Exchange" : "Challenge"}
          </Typography>
          <FormControl
            size="small"
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

          {!isExchange && (
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
          )}
        </>
      )}

      {challenge && (
        <>
          <Box
            sx={{
              pb: 1,
              border: "1px solid rgb(107, 114, 126)",
              borderRadius: "6px 6px 0px 0px",
              padding: 1.5,
              fontSize: "14px",
              overflow: "auto",
              width: "100%",
            }}
          >
            <Box
              sx={{
                display: "flex",
                justifyContent: "space-between",
              }}
            >
              <span>Mint</span>
              <a
                href={`https://solscan.io/account/${challenge?.mint}`}
                target="_blank"
                rel="noreferrer"
                style={{
                  maxWidth: "100px",
                  opacity: "0.7",
                  textDecoration: "underline",
                }}
              >
                {challenge?.mint?.substring(0, 10)}...
              </a>
            </Box>
            <Box
              sx={{
                display: "flex",
                justifyContent: "space-between",
              }}
            >
              <span>Entry Fee</span>
              <span>{challenge?.entryFee?.toString()}</span>
            </Box>
            <Box
              sx={{
                display: "flex",
                justifyContent: "space-between",
              }}
            >
              <span>Provider Rake</span>
              <span>{challenge?.providerRake?.toString()}</span>
            </Box>
            <Box
              sx={{
                display: "flex",
                justifyContent: "space-between",
              }}
            >
              <span>Mediator Rake</span>
              <span>{challenge?.mediatorRake?.toString()}</span>
            </Box>
            <Box
              sx={{
                display: "flex",
                justifyContent: "space-between",
              }}
            >
              <span>Players Joined</span>
              <span>
                {challenge?.currentPlayerCount +
                  " / " +
                  challenge?.maxPlayerCount}
              </span>
            </Box>
          </Box>
        </>
      )}

      {type === "FT" && (
        <Button
          className="join-button"
          fullWidth
          variant="contained"
          size="large"
          disabled={isLoading || challengeAddress.length < 35 || joined}
          sx={
            challenge
              ? {
                  borderRadius: "8px !important",
                  borderTopRightRadius: "0px !important",
                  borderTopLeftRadius: "0px !important",
                  backgroundColor: "#3eb718",
                  fontFamily: "Rubik",
                  textTransform: "none",
                  boxShadow: "#3eb71870 0px 8px 16px 0px!important",
                  "&:hover": {
                    boxShadow: "none !important",
                    backgroundColor: "#ff714f14",
                  },
                }
              : {
                  backgroundColor: "#3eb718",
                  fontFamily: "Rubik",
                  textTransform: "none",
                  boxShadow: "#3eb71870 0px 8px 16px 0px!important",
                  borderRadius: "8px !important",
                  "&:hover": {
                    boxShadow: "none !important",
                    backgroundColor: "#ff714f14",
                  },
                }
          }
          onClick={() => fetchChallengeDetails()}
        >
          {isLoading ? <CircularProgress size={24} /> : "View Challenge"}
        </Button>
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
      ) : isExchange ? (
        <Exchange
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
    </Box>
  );
};
