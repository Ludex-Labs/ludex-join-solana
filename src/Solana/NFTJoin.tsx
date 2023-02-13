/* eslint-disable react-hooks/exhaustive-deps */
import { FC, useEffect, useState } from "react";
import { toast } from "react-hot-toast";

import { NFTChallenge } from "@ludex-labs/ludex-sdk-js";
import { Wallet } from "@ludex-labs/ludex-sdk-js/lib/web3/utils";
import { guestIdentity, Metaplex } from "@metaplex-foundation/js";
import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutline";
import DescriptionIcon from "@mui/icons-material/Description";
import RefreshIcon from "@mui/icons-material/Refresh";
// MUI
import {
  Box,
  Button,
  Checkbox,
  Dialog,
  DialogTitle,
  FormControl,
  FormControlLabel,
  FormGroup,
  IconButton,
  InputAdornment,
  InputLabel,
  OutlinedInput,
  Select,
  TextField,
  Typography,
} from "@mui/material";
import {
  Connection,
  LAMPORTS_PER_SOL,
  PublicKey,
  Transaction,
} from "@solana/web3.js";

interface Offering {
  account: {
    player: PublicKey;
    tokenAccount: PublicKey | null;
    mint: PublicKey | null;
    isEscrowed: boolean;
    amount: any;
  };
  authority: PublicKey | undefined;
  publicKey: PublicKey;
}

interface DeserialziedOffering {
  name: string;
  amount: number;
  isEscrowed: boolean;
  mint: string | null;
  _mint: PublicKey | null;
  publicKey: string;
  authority: string;
  metadata: any;
}

export const NFTJoin: FC<{
  publicKey: string;
  wallet?: Wallet;
  isMainnet: boolean;
  challengeAddress: string;
  connection: Connection;
  isLoading: boolean;
  setIsLoading: (isLoading: boolean) => void;
  sendTransaction?: (tx: Transaction) => Promise<string>;
}> = (props) => {
  const {
    publicKey,
    wallet,
    isMainnet,
    challengeAddress,
    connection,
    isLoading,
    setIsLoading,
    sendTransaction,
  } = props;
  const [open, setOpen] = useState<boolean>(false);
  const [NFTmint, setNFTmint] = useState<string>("");
  const [amount, setAmount] = useState<number>(0.001);
  const [selectedOffering, setSelectedOffering] =
    useState<DeserialziedOffering | null>(null);
  const [offerings, setOfferings] = useState<DeserialziedOffering[]>([]);
  const [openOffering, setOpenOffering] = useState<boolean>(false);
  const [accepted, setAccepted] = useState<boolean>(false);
  const [playerStatus, setPlayerStatus] = useState<string>("");

  useEffect(() => {
    if (challengeAddress.length !== 44) return;
    getPlayerStatus();
  }, [challengeAddress]);

  const getPlayerStatus = async () => {
    if (!wallet) return;
    // Possible Statuses: "NOT_IN_GAME" | "ACCEPTED" | "JOINED"
    var playerStatus = await NFTChallenge.NftChallengeTXClient.getPlayerStatus(
      connection,
      wallet?.publicKey,
      challengeAddress
    );
    setPlayerStatus(playerStatus);
    toast.success("Player status: " + playerStatus);
  };

  const joinNFTChallenge = async () => {
    if (publicKey === "") throw Error("Not connected");
    if (!wallet || !sendTransaction) return;
    setIsLoading(true);
    try {
      const ludexTx = new NFTChallenge.NftChallengeTXClient(
        connection,
        challengeAddress,
        {
          wallet: wallet,
        }
      );
      const tx = await ludexTx.join(wallet.publicKey.toBase58()).getTx();
      const result = connection.getLatestBlockhash();
      tx.recentBlockhash = (await result)?.blockhash;
      if (!sendTransaction) throw new Error("Failed to send transaction.");
      const signature = await sendTransaction(tx);

      if (!signature.toString().includes("Error")) {
        setIsLoading(false);
        setPlayerStatus("JOINED");
        toast.success("NFT Challenge joined!");
      } else throw new Error(signature);
    } catch (e) {
      console.error(e);
      toast.error("Failed to join challenge");
      setIsLoading(false);
    }
  };

  const getOfferings = async () => {
    try {
      if (!wallet) return;
      var _offerings = await NFTChallenge.NftChallengeTXClient.getOfferings(
        connection,
        challengeAddress,
        wallet
      );

      const offerings = _offerings.map((offering: Offering) => {
        return {
          amount: offering?.account?.amount?.toNumber() / LAMPORTS_PER_SOL,
          isEscrowed: offering?.account.isEscrowed,
          publicKey: offering?.publicKey?.toBase58(),
          authority: offering?.authority ? offering?.authority?.toBase58() : "",
          metadata: null,
          _mint: offering?.account?.mint ? offering?.account?.mint : null,
          mint: offering?.account?.mint
            ? offering?.account?.mint?.toBase58()
            : null,
          name: offering?.account?.mint
            ? "NFT - " + offering?.account?.mint?.toBase58()
            : offering?.account?.amount?.toNumber() / LAMPORTS_PER_SOL + " SOL",
        };
      });

      setOfferings(offerings);
    } catch (e) {
      console.error(e);
      toast.error("Error getting offerings.");
    }
  };

  useEffect(() => {
    if (challengeAddress.length === 44) {
      getOfferings();
    }
  }, [challengeAddress, wallet]);

  const onClickAddOffering = async (type: string) => {
    setIsLoading(true);
    try {
      const ludexTx = new NFTChallenge.NftChallengeTXClient(
        connection,
        challengeAddress,
        {
          wallet: wallet,
        }
      );
      var tx: Transaction | undefined;
      if (type === "SOL") {
        tx = await ludexTx.addSolOffering(publicKey, amount).getTx();
      } else if (type === "NFT") {
        tx = await ludexTx.addNftOffering(publicKey, NFTmint, 1).getTx();
      } else throw new Error("Invalid offering type");
      const result = await connection.getLatestBlockhash();
      tx.recentBlockhash = result.blockhash;
      tx.feePayer = new PublicKey(publicKey);
      if (!sendTransaction) return;
      const res = await sendTransaction(tx);
      if (res.toString().includes("Error")) throw new Error(res);
      else toast.success("Offering added!");
      setIsLoading(false);
      setOpen(false);
      getOfferings();
    } catch (e) {
      toast.error("Error adding offering.");
      setIsLoading(false);
    }
  };

  const onClickRemoveOffering = async () => {
    setIsLoading(true);
    try {
      const ludexTx = new NFTChallenge.NftChallengeTXClient(
        connection,
        challengeAddress,
        {
          wallet: wallet,
        }
      );
      if (!selectedOffering?.publicKey) return;
      var tx = await ludexTx
        .removeOffering(publicKey, selectedOffering?.publicKey)
        .getTx();
      const result = await connection.getLatestBlockhash();
      tx.recentBlockhash = result.blockhash;
      tx.feePayer = new PublicKey(publicKey);
      if (sendTransaction) {
        const res = await sendTransaction(tx);
        if (res.toString().includes("Error")) throw new Error(res);
        toast.success("Offering removing!");
        setOpenOffering(false);
      }
      setIsLoading(false);
    } catch (e) {
      console.error(e);
      toast.error("Error removing offering.");
      setIsLoading(false);
    }
  };

  const acceptOffering = async () => {
    setIsLoading(true);
    try {
      const ludexTx = new NFTChallenge.NftChallengeTXClient(
        connection,
        challengeAddress,
        {
          wallet: wallet,
        }
      );
      var tx = await ludexTx.accept(publicKey).getTx();
      const result = await connection.getLatestBlockhash();
      tx.recentBlockhash = result.blockhash;
      tx.feePayer = new PublicKey(publicKey);
      if (!sendTransaction) return;
      const signature = await sendTransaction(tx);
      if (!signature.toString().includes("Error")) {
        setIsLoading(false);
        setAccepted(true);
        toast.success("Offering accepted!");
      } else throw new Error(signature);
      setIsLoading(false);
    } catch (e) {
      console.error(e);
      toast.error("Error accepting offering.");
      setIsLoading(false);
    }
  };

  const onClickOffering = async (offering: any) => {
    if (offering._mint) {
      const mx = Metaplex.make(connection).use(guestIdentity());
      const nft = await mx.nfts().findByMint({ mintAddress: offering._mint });
      const response = await fetch(nft?.uri);
      const metadata = await response.json();
      offering.metadata = metadata;
    }
    setSelectedOffering(offering);
    setOpenOffering(true);
  };

  return (
    <>
      <Button
        fullWidth
        variant="contained"
        size="large"
        sx={{ mt: 1 }}
        onClick={() => joinNFTChallenge()}
        disabled={
          isLoading ||
          challengeAddress.length !== 44 ||
          playerStatus === "JOINED" ||
          playerStatus === "ACCEPTED"
        }
      >
        {playerStatus === "JOINED" || playerStatus === "ACCEPTED" ? (
          <>
            <CheckCircleOutlineIcon sx={{ mr: 1 }} />
            Joined
          </>
        ) : (
          "Join"
        )}
      </Button>

      <FormControl fullWidth sx={{ mb: 0, mt: 4 }}>
        <InputLabel>Offerings</InputLabel>
        <Select
          multiple
          native
          label="Native"
          disabled={isLoading || challengeAddress.length !== 44}
          value={[selectedOffering]}
          sx={{
            borderBottomRightRadius: 0,
            borderBottomLeftRadius: 0,
            overflow: "auto",
          }}
        >
          {offerings.length > 0 ? (
            offerings.map((offering: any, i: number) => {
              return (
                <option
                  key={i}
                  value={offering.name}
                  onClick={() => onClickOffering(offering)}
                  style={{
                    padding: 5,
                    borderBottom: "1px solid #646567",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                  }}
                >
                  {offering.name}
                </option>
              );
            })
          ) : (
            <option>No offerings yet.</option>
          )}
        </Select>

        <IconButton
          onClick={() => {
            toast.success("Refreshing offerings...");
            getOfferings();
          }}
          sx={{
            position: "absolute",
            right: 0,
            marginRight: "5px",
            marginTop: "2px",
            minWidth: "5px",
          }}
        >
          <RefreshIcon />
        </IconButton>
      </FormControl>
      <Button
        onClick={() => setOpen(!open)}
        fullWidth
        variant="contained"
        sx={{ mb: 1, borderTopRightRadius: 0, borderTopLeftRadius: 0 }}
        disabled={
          isLoading ||
          accepted ||
          playerStatus === "ACCEPTED" ||
          challengeAddress.length !== 44
        }
      >
        Add Offering
      </Button>

      <Button
        fullWidth
        variant="contained"
        onClick={() => acceptOffering()}
        size="large"
        disabled={
          isLoading ||
          accepted ||
          challengeAddress.length !== 44 ||
          playerStatus === "ACCEPTED"
        }
      >
        {playerStatus !== "ACCEPTED" ? (
          "ACCEPT"
        ) : (
          <>
            <CheckCircleOutlineIcon sx={{ mr: 1 }} />
            ACCEPTED
          </>
        )}
      </Button>

      <Dialog
        className="dark-dialog-slim"
        onClose={() => setOpen(false)}
        open={open}
      >
        <Box
          sx={{
            width: "350px",
          }}
        >
          <DialogTitle
            sx={{ color: "white", textAlign: "center", fontWeight: 500 }}
          >
            Add Offering
          </DialogTitle>
          <Box
            sx={{
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              flexDirection: "column",
              padding: "0 24px",
              paddingBottom: "16px",
            }}
          >
            <TextField
              fullWidth
              size="small"
              label="Amount of SOL"
              sx={{ mb: 1 }}
              value={amount}
              type="number"
              onChange={(e) => {
                var amount = parseFloat(e.currentTarget.value);
                if (!isNaN(amount)) setAmount(amount);
                else setAmount(0);
              }}
            />
            <Button
              fullWidth
              size="small"
              variant="contained"
              sx={{ mb: 2 }}
              onClick={() => onClickAddOffering("SOL")}
              disabled={isLoading || amount === 0}
            >
              Add SOL Offering
            </Button>

            <Typography variant="subtitle1" sx={{ mb: 2 }}>
              or
            </Typography>

            <TextField
              size="small"
              fullWidth
              label="NFT Mint Address"
              value={NFTmint}
              onChange={(e) => setNFTmint(e.currentTarget.value)}
            />

            {/* TO DO - add escrowless  */}
            <FormGroup>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={false}
                    onClick={() => toast.error("Escrowless not available yet.")}
                  />
                }
                label="Escrowless"
              />
            </FormGroup>
            <Button
              size="small"
              fullWidth
              variant="contained"
              onClick={() => onClickAddOffering("NFT")}
              disabled={isLoading || NFTmint === ""}
              sx={{ mb: 2 }}
            >
              Add NFT Offering
            </Button>
          </Box>
        </Box>
      </Dialog>

      <Dialog
        className="dark-dialog"
        onClose={() => setOpenOffering(false)}
        open={openOffering}
      >
        <Box
          sx={{
            width: "350px",
          }}
        >
          <DialogTitle
            sx={{
              color: "white",
              textAlign: "center",
              fontWeight: 500,
            }}
          >
            {selectedOffering?.metadata?.name
              ? selectedOffering?.metadata?.name
              : "Offering"}
          </DialogTitle>

          <Box
            sx={{
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              flexDirection: "column",
              padding: "0 20px",
            }}
          >
            {selectedOffering?.metadata?.image ? (
              <img
                src={selectedOffering?.metadata?.image}
                alt="nft_pic"
                width="100px"
              />
            ) : (
              <Typography sx={{ fontWeight: "bold" }}>
                {selectedOffering?.name}
              </Typography>
            )}
            <Typography variant="subtitle2" sx={{ mb: 2 }}>
              {selectedOffering?.metadata?.description}
            </Typography>

            <FormControl size="small" fullWidth sx={{ width: "100%", mb: 2 }}>
              <InputLabel>Authority</InputLabel>
              <OutlinedInput
                value={selectedOffering?.authority}
                label="Offering"
                disabled
                fullWidth
                endAdornment={
                  <InputAdornment position="end">
                    <IconButton
                      disabled={challengeAddress === ""}
                      onClick={() =>
                        window.open(
                          `https://solscan.io/account/` +
                            selectedOffering?.authority +
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

            <FormControl size="small" fullWidth sx={{ width: "100%", mb: 2 }}>
              <InputLabel>Offering</InputLabel>
              <OutlinedInput
                value={selectedOffering?.publicKey}
                label="Offering"
                disabled
                fullWidth
                endAdornment={
                  <InputAdornment position="end">
                    <IconButton
                      disabled={challengeAddress === ""}
                      onClick={() =>
                        window.open(
                          `https://solscan.io/tx/` +
                            selectedOffering?.publicKey +
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

            <Button
              fullWidth
              variant="contained"
              sx={{ mb: 2, borderTopRightRadius: 0, borderTopLeftRadius: 0 }}
              onClick={() => onClickRemoveOffering()}
              disabled={
                isLoading ||
                selectedOffering?.authority !== wallet?.publicKey?.toBase58()
              }
            >
              Remove Offering
            </Button>
          </Box>
        </Box>
      </Dialog>
    </>
  );
};
