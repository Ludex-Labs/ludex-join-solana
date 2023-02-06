/* eslint-disable react-hooks/exhaustive-deps */
import { FC, useEffect, useState } from "react";
import { Challenge, NFTChallenge } from "@ludex-labs/ludex-sdk-js";
import { Wallet } from "@ludex-labs/ludex-sdk-js/lib/web3/utils";
import { Connection, Transaction } from "@solana/web3.js";
import { toast } from "react-hot-toast";
import { NFTJoin } from "./NFTJoin";
import DescriptionIcon from "@mui/icons-material/Description";
import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutline";
import {
  Box,
  Button,
  IconButton,
  Typography,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  OutlinedInput,
  InputAdornment,
} from "@mui/material";

export const Join: FC<{
  publicKey: string;
  wallet?: Wallet;
  isMainnet: boolean;
  connection: Connection;
  changeNetwork: (network: string) => void;
  sendTransaction?: (tx: Transaction) => Promise<string>;
}> = (props) => {
  const {
    publicKey,
    wallet,
    isMainnet,
    connection,
    changeNetwork,
    sendTransaction,
  } = props;
  const [type, setType] = useState<string>("FT");
  const [joined, setJoined] = useState<boolean>(false);
  const [challengeAddress, setChallengeAddress] = useState<string>("");
  const [playerStatus, setPlayerStatus] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(false);

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

  useEffect(() => {
    if (challengeAddress.length !== 44 || type !== "NFT") return;
    getPlayerStatus();
  }, [challengeAddress, type]);

  const getPlayerStatus = async () => {
    if (!wallet) return;
    // "NOT_IN_GAME" | "ACCEPTED" | "JOINED"
    var playerStatus = await NFTChallenge.NftChallengeTXClient.getPlayerStatus(
      connection,
      wallet?.publicKey,
      challengeAddress
    );
    setPlayerStatus(playerStatus);
    toast.success("Player status: " + playerStatus);
  };

  const submitFTChallenge = async () => {
    if (!wallet || !sendTransaction) return;
    setIsLoading(true);
    const ludexTx = new Challenge.ChallengeTXClient(
      connection,
      challengeAddress,
      {
        wallet: wallet,
        cluster: isMainnet ? "MAINNET" : "DEVNET",
      }
    );
    ludexTx
      .join(wallet.publicKey.toBase58())
      .getTx()
      .then((tx) => {
        connection
          .getLatestBlockhash() //.getRecentBlockhash()
          .then((result) => {
            tx.recentBlockhash = result.blockhash;
            if (!sendTransaction)
              throw new Error("Failed to send transaction.");
            return sendTransaction(tx);
          })
          .then((signature) => {
            if (!signature.toString().includes("Error")) {
              setJoined(true);
              setIsLoading(false);
              toast.success("FT Challenge joined!");
            } else throw new Error(signature);
          })
          .catch((e) => {
            console.error(e);
            toast.error("Failed to join challenge.");
            setIsLoading(false);
          });
      });
  };

  const submitNFTChallenge = async () => {
    if (publicKey === "") throw Error("Not connected");
    if (!wallet || !sendTransaction) return;
    setIsLoading(true);
    const ludexTx = new NFTChallenge.NftChallengeTXClient(
      connection,
      challengeAddress,
      {
        wallet: wallet,
      }
    );
    ludexTx
      .join(wallet.publicKey.toBase58())
      .getTx()
      .then((tx) => {
        connection
          .getLatestBlockhash()
          .then((result) => {
            tx.recentBlockhash = result.blockhash;
            if (!sendTransaction)
              throw new Error("Failed to send transaction.");
            return sendTransaction(tx);
          })
          .then((signature) => {
            if (!signature.toString().includes("Error")) {
              setJoined(true);
              setIsLoading(false);
              toast.success("NFT Challenge joined!");
            } else throw new Error(signature);
          })
          .catch((e) => {
            console.error(e);
            toast.error("Failed to join challenge");
            setIsLoading(false);
          });
      });
  };

  return (
    <Box>
      <Typography variant={"h5"} sx={{ mb: 2 }}>
        Join Challenge
      </Typography>
      <FormControl fullWidth sx={{ width: "100%", mb: 3 }}>
        <InputLabel>Challenge Address</InputLabel>
        <OutlinedInput
          onChange={(e) => setChallengeAddress(e.currentTarget.value)}
          value={challengeAddress}
          label="Challenge Address"
          disabled={joined}
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
          inputProps={{
            "aria-label": "weight",
          }}
          fullWidth
        />
      </FormControl>

      <FormControl fullWidth sx={{ mb: 3 }}>
        <InputLabel>Network</InputLabel>
        <Select
          value={isMainnet ? "mainnet" : "devnet"}
          disabled={joined}
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

      <FormControl fullWidth sx={{ mb: 2 }}>
        <InputLabel>Type</InputLabel>
        <Select
          value={type === "FT" ? "FT" : "NFT"}
          disabled={joined}
          label="Type"
          onChange={(e) =>
            e.target.value === "FT" ? setType("FT") : setType("NFT")
          }
        >
          <MenuItem value={"FT"}>Fungible Token</MenuItem>
          <MenuItem value={"NFT"}>Non-Fungible Token</MenuItem>
        </Select>
      </FormControl>

      <Box>
        <Button
          fullWidth
          variant="contained"
          size="large"
          disabled={
            isLoading ||
            challengeAddress.length !== 44 ||
            joined ||
            playerStatus === "JOINED" ||
            playerStatus === "ACCEPTED"
          }
          sx={{ mt: 1 }}
          onClick={() =>
            type === "NFT" ? submitNFTChallenge() : submitFTChallenge()
          }
        >
          {joined ||
          playerStatus === "JOINED" ||
          playerStatus === "ACCEPTED" ? (
            <>
              <CheckCircleOutlineIcon sx={{ mr: 1 }} />
              Joined
            </>
          ) : (
            "JOIN"
          )}
        </Button>
      </Box>

      {type === "NFT" && (
        <NFTJoin
          publicKey={publicKey}
          wallet={wallet}
          sendTransaction={sendTransaction}
          isMainnet={isMainnet}
          challengeAddress={challengeAddress}
          connection={connection}
          playerStatus={playerStatus}
          isLoading={isLoading}
          setIsLoading={setIsLoading}
        />
      )}
    </Box>
  );
};
