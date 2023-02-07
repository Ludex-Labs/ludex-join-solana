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

  // const sendTransaction = async (transaction: Transaction): Promise<string> => {
  //   try {
  //     if (!provider) {
  //       console.error("provider not initialized yet");
  //       return "";
  //     }
  //     const solanaWallet = new SolanaWallet(provider);
  //     transaction = await solanaWallet.signTransaction(transaction);
  //     if (connection) {
  //       const signature = await connection.sendRawTransaction(
  //         transaction.serialize()
  //       );
  //       return signature;
  //     }
  //     return "";
  //   } catch (error) {
  //     return error as string;
  //   }
  // };

  console.log(wallet?.signTransaction);
  // console.log(sendTransaction);

  const joinFTChallenge = async () => {
    if (!wallet || !wallet?.signTransaction) return;
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
            if (!wallet?.signTransaction)
              throw new Error("Failed to send transaction.");
            return wallet?.signTransaction(tx);
          })
          .then((signature) => {
            if (!signature.toString().includes("Error")) {
              setJoined(true);
              setIsLoading(false);
              toast.success("FT Challenge joined!");
            } else throw new Error(signature.toString());
          })
          .catch((e) => {
            console.error(e);
            toast.error("Failed to join challenge.");
            setIsLoading(false);
          });
      });
  };

  return (
    <>
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

      {type === "FT" ? (
        <Button
          fullWidth
          variant="contained"
          size="large"
          disabled={isLoading || challengeAddress.length !== 44 || joined}
          sx={{ mt: 1 }}
          onClick={() => joinFTChallenge()}
        >
          {joined ? (
            <>
              <CheckCircleOutlineIcon sx={{ mr: 1 }} />
              Joined
            </>
          ) : (
            "JOIN"
          )}
        </Button>
      ) : (
        <NFTJoin
          publicKey={publicKey}
          wallet={wallet}
          isMainnet={isMainnet}
          challengeAddress={challengeAddress}
          connection={connection}
          isLoading={isLoading}
          setIsLoading={setIsLoading}
        />
      )}
    </>
  );
};
