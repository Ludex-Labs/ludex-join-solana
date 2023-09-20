/* eslint-disable react-hooks/exhaustive-deps */
import { FC, useEffect, useState } from "react";
import { toast } from "react-hot-toast";

import { NftChallengeTXClient } from "@ludex-labs/ludex-sdk-js/web3/solana/nft-challenge/client";
import { Wallet } from "@ludex-labs/ludex-sdk-js/web3/solana/utils";
import { Offering } from "@ludex-labs/ludex-sdk-js/web3/solana/nft-challenge/client";
import { guestIdentity, Metaplex } from "@metaplex-foundation/js";
import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutline";
import DescriptionIcon from "@mui/icons-material/Description";
import RefreshIcon from "@mui/icons-material/Refresh";
import {
  Connection,
  LAMPORTS_PER_SOL,
  PublicKey,
  Transaction,
} from "@solana/web3.js";

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
  TextField,
  Typography,
} from "@mui/material";

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
  sendTransaction?: (tx: Transaction) => Promise<string>;
  viewOfferings?: boolean;
  setViewOfferings?: (view: boolean) => void;
}> = (props) => {
  const {
    publicKey,
    wallet,
    isMainnet,
    challengeAddress,
    connection,
    isLoading,
    sendTransaction,
    viewOfferings,
    setViewOfferings,
  } = props;
  const [open, setOpen] = useState<boolean>(false);
  const [mint, setMint] = useState<string>("");
  const [amount, setAmount] = useState<number>(0.001);
  const [selectedOffering, setSelectedOffering] =
    useState<DeserialziedOffering | null>(null);
  const [offerings, setOfferings] = useState<DeserialziedOffering[]>([]);
  const [openOffering, setOpenOffering] = useState<boolean>(false);
  const [accepted, setAccepted] = useState<boolean>(false);
  const [playerStatus, setPlayerStatus] = useState<string>("");
  const [escrowed, setEscrowed] = useState<boolean>(false);
  const [tokenAmount, setTokenAmount] = useState<number>(1);

  useEffect(() => {
    if (challengeAddress.length < 40) return;
    getPlayerStatus();
  }, [challengeAddress]);

  const getPlayerStatus = async () => {
    if (!wallet) return;
    // Possible Statuses: "NOT_IN_GAME" | "ACCEPTED" | "JOINED"
    var playerStatus = await NftChallengeTXClient.getPlayerStatus(
      connection,
      wallet?.publicKey,
      challengeAddress
    );
    setPlayerStatus(playerStatus);
    toast.success("Player status: " + playerStatus);
  };

  const joinNFTChallenge = async () => {
    if (!wallet || !sendTransaction) return;
    const ludexTx = new NftChallengeTXClient(connection, challengeAddress);
    const tx = await ludexTx.join(wallet.publicKey.toBase58()).getTx();
    const result = connection.getLatestBlockhash();
    tx.recentBlockhash = (await result)?.blockhash;
    const res = await sendTransaction(tx);
    if (!res.toString().includes("Error")) {
      setPlayerStatus("JOINED");
      toast.success("NFT Challenge joined!");
      console.info("sig: ", res);
    }
  };

  const getOfferings = async () => {
    try {
      if (!wallet) return;
      var _offerings = await NftChallengeTXClient.getOfferings(
        connection,
        challengeAddress
      );

      const offerings: DeserialziedOffering[] = [];

      await Promise.all(
        _offerings.map(async (offering: Offering) => {
          let metadata: any = null;

          if (offering?.mint) {
            const mx = await Metaplex.make(connection).use(guestIdentity());
            const nft = await mx
              .nfts()
              .findByMint({ mintAddress: offering?.mint });
            const response = await fetch(nft?.uri);
            metadata = await response.json();
          }
          offerings.push({
            amount: offering?.amount?.toNumber() / LAMPORTS_PER_SOL,
            isEscrowed: offering.isEscrowed,
            publicKey: offering?.publicKey?.toBase58(),
            authority: offering?.authority
              ? offering?.authority?.toBase58()
              : "",
            metadata: metadata,
            _mint: offering?.mint ? offering?.mint : null,
            mint: offering?.mint ? offering?.mint?.toBase58() : null,
            name: offering?.mint
              ? "NFT - " + offering?.mint?.toBase58()
              : offering?.amount?.toNumber() / LAMPORTS_PER_SOL + " SOL",
          });
        })
      );

      setOfferings(offerings);
    } catch (e) {
      console.error(e);
      toast.error("Error getting offerings.");
    }
  };

  useEffect(() => {
    if (challengeAddress.length > 40) {
      getOfferings();
    }
  }, [challengeAddress, wallet]);

  const addOffering = async (type: string) => {
    const ludexTx = new NftChallengeTXClient(connection, challengeAddress);
    var tx: Transaction | undefined;
    if (type === "SOL") {
      tx = await ludexTx.addSolOffering(publicKey, amount).getTx();
    } else if (type === "NFT" && escrowed) {
      tx = await ludexTx
        .addEscrowedOffering(publicKey, mint, tokenAmount)
        .getTx();
    } else if (type === "NFT" && !escrowed) {
      tx = await ludexTx.addEscrowlessOffering(publicKey, mint).getTx();
    } else throw new Error("Invalid offering type");
    const result = await connection.getLatestBlockhash();
    tx.recentBlockhash = result.blockhash;
    tx.feePayer = new PublicKey(publicKey);
    if (!sendTransaction) return;
    const res = await sendTransaction(tx);
    if (res.toString().includes("Error")) return;
    toast.success("Offering is being added!");
    setMint("");
    setOpen(false);
    console.info("sig: ", res);
  };

  const removeOffering = async () => {
    const ludexTx = new NftChallengeTXClient(connection, challengeAddress);
    if (!selectedOffering?.publicKey) return;
    var tx = await ludexTx
      .removeOffering(publicKey, selectedOffering?.publicKey)
      .getTx();
    const result = await connection.getLatestBlockhash();
    tx.recentBlockhash = result.blockhash;
    tx.feePayer = new PublicKey(publicKey);
    if (!sendTransaction) return;
    const res = await sendTransaction(tx);
    if (res.toString().includes("Error")) return;
    toast.success("Offering is being removed!");
    setOpenOffering(false);
    console.info("sig: ", res);
  };

  const acceptOffering = async () => {
    const ludexTx = new NftChallengeTXClient(connection, challengeAddress);
    var tx = await ludexTx.accept(publicKey).getTx();
    const result = await connection.getLatestBlockhash();
    tx.recentBlockhash = result.blockhash;
    tx.feePayer = new PublicKey(publicKey);
    if (!sendTransaction) return;
    const res = await sendTransaction(tx);
    if (res.toString().includes("Error")) return;
    toast.success("Offering accepted!");
    setAccepted(true);
    console.info("sig: ", res);
  };

  return (
    <>
      {viewOfferings ? (
        <Button
          fullWidth
          size="large"
          variant="contained"
          onClick={() => setViewOfferings && setViewOfferings(false)}
          sx={{
            backgroundColor: "#ff714f",
            display: "flex",
            alignItems: "center",
            padding: "10px",
            borderRadius: "10px",
            maxWidth: "290px",
            height: "42.25px",
            boxShadow: "#ff714f3d 0px 8px 16px 0px !important",
            "&:hover": {
              boxShadow: "none !important",
            },
            fontFamily: "Rubik",
            fontSize: "1rem",
            fontWeight: 500,
            textTransform: "none",
          }}
        >
          Back
        </Button>
      ) : (
        <>
          <Button
            className="join-button"
            fullWidth
            size="large"
            variant="contained"
            onClick={() => joinNFTChallenge()}
            disabled={
              isLoading ||
              challengeAddress.length < 40 ||
              playerStatus === "JOINED" ||
              playerStatus === "ACCEPTED"
            }
            sx={{
              backgroundColor: "#3eb718",
              fontFamily: "Rubik",
              textTransform: "none",
              boxShadow: "#3eb71870 0px 8px 16px 0px!important",
              borderRadius: "10px !important",
              "&:hover": {
                boxShadow: "none !important",
                backgroundColor: "#ff714f14",
              },
            }}
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
          <Button
            className="join-button"
            onClick={() => setViewOfferings && setViewOfferings(true)}
            fullWidth
            variant="contained"
            size="large"
            sx={{
              backgroundColor: "#349bc6",
              mt: 2,
              fontFamily: "Rubik",
              textTransform: "none",
              boxShadow: "#397f9d7a 0px 8px 16px 0px!important",
              borderRadius: "10px !important",
              "&:hover": {
                boxShadow: "none !important",
                backgroundColor: "#ff714f14",
              },
            }}
          >
            Offerings
          </Button>
        </>
      )}

      {viewOfferings && (
        <>
          <Typography variant="subtitle1" sx={{ mt: 2 }}>
            Offerings
          </Typography>
          <Box
            sx={{
              width: "100%",
              minHeight: "100px",
              borderRadius: "10px",
              borderBottomLeftRadius: "0px",
              borderBottomRightRadius: "0px",
              border: "1px solid #6b727e",
              display: "flex",
              alignItems: "center",

              overflow: "auto",
              padding: "5px",
            }}
          >
            {offerings.length > 0 ? (
              offerings.map((offering: any, i: number) => {
                return (
                  <Button
                    key={i}
                    variant="outlined"
                    onClick={() => {
                      setSelectedOffering(offering);
                      setOpenOffering(true);
                    }}
                    style={{
                      margin: "5px 5px",
                      borderBottom: "1px solid #646567",
                      height: "90px",
                      width: "50px",
                      display: "flex",
                      flexDirection: "column",
                      justifyContent: "flex-start",
                      alignContent: "flex-start",
                      overflow: "hidden",
                      whiteSpace: "nowrap",
                    }}
                  >
                    <Typography
                      variant="subtitle2"
                      sx={{
                        mb: 0.5,
                        overflow: "hidden",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {!offering?.mint ? offering.amount?.toString() : "NFT"}
                    </Typography>

                    <Box
                      sx={{
                        display: "flex",
                        justifyContent: "center",
                        alignItems: "center",
                        height: "50px",
                      }}
                    >
                      {!offering?.mint ? (
                        <img
                          src={"./assets/solana.svg"}
                          alt="Solana"
                          style={{ height: "25px", width: "auto" }}
                        ></img>
                      ) : offering?.metadata?.image ? (
                        <img
                          src={offering?.metadata?.image}
                          alt={offering?.metadata?.name}
                          style={{ height: "50px", width: "auto" }}
                        ></img>
                      ) : null}
                    </Box>
                  </Button>
                );
              })
            ) : (
              <Typography sx={{ width: "100%" }}>No offerings yet.</Typography>
            )}
          </Box>

          <Button
            className="join-button"
            onClick={() => {
              toast.success("Refreshing offerings...");
              getOfferings();
            }}
            fullWidth
            variant="contained"
            size="large"
            disabled={
              isLoading ||
              accepted ||
              challengeAddress.length < 40 ||
              playerStatus !== "JOINED"
            }
            sx={{
              backgroundColor: "#349bc6",
              borderRadius: "10px",
              borderTopLeftRadius: "0px",
              borderTopRightRadius: "0px",
              fontFamily: "Rubik",
              textTransform: "none",
              boxShadow: "#397f9d7a 0px 8px 16px 0px!important",
              "&:hover": {
                boxShadow: "none !important",
                backgroundColor: "#ff714f14",
              },
            }}
          >
            <RefreshIcon sx={{ mr: 1 }} />
            Refresh Offerings
          </Button>

          <Button
            className="join-button"
            onClick={() => setOpen(!open)}
            fullWidth
            variant="contained"
            size="large"
            disabled={
              isLoading ||
              accepted ||
              challengeAddress.length < 40 ||
              playerStatus !== "JOINED"
            }
            sx={{
              backgroundColor: "#349bc6",
              mt: 2,
              fontFamily: "Rubik",
              textTransform: "none",
              boxShadow: "#397f9d7a 0px 8px 16px 0px!important",
              borderRadius: "10px !important",
              "&:hover": {
                boxShadow: "none !important",
                backgroundColor: "#ff714f14",
              },
            }}
          >
            Add Offering
          </Button>

          <Button
            className="join-button"
            fullWidth
            variant="contained"
            onClick={() => acceptOffering()}
            size="large"
            disabled={
              isLoading ||
              accepted ||
              challengeAddress.length < 40 ||
              playerStatus === "ACCEPTED"
            }
            sx={{
              backgroundColor: "#3eb718",
              mt: 2,
              fontFamily: "Rubik",
              textTransform: "none",
              boxShadow: "#3eb71870 0px 8px 16px 0px!important",
              borderRadius: "10px !important",
              "&:hover": {
                boxShadow: "none !important",
                backgroundColor: "#ff714f14",
              },
            }}
          >
            {playerStatus !== "ACCEPTED" ? (
              "Accept"
            ) : (
              <>
                <CheckCircleOutlineIcon sx={{ mr: 1 }} />
                Accepted
              </>
            )}
          </Button>
        </>
      )}

      <Dialog
        className="dark-dialog"
        onClose={() => setOpen(false)}
        open={open}
      >
        <Box
          sx={{
            width: "100%",
            maxWidth: "300px",
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
              minWidth: "250px",
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
              sx={{
                mb: 2,
                backgroundColor: "#349bc6",
                fontFamily: "Rubik",
                textTransform: "none",
                boxShadow: "#397f9d7a 0px 8px 16px 0px!important",
                borderRadius: "10px !important",
                "&:hover": {
                  boxShadow: "none !important",
                  backgroundColor: "#ff714f14",
                },
              }}
              onClick={() => addOffering("SOL")}
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
              label="Mint Address"
              value={mint}
              onChange={(e) => setMint(e.currentTarget.value)}
            />

            {!escrowed && (
              <TextField
                sx={{ mt: 2 }}
                size="small"
                fullWidth
                label="Token Amount"
                type="number"
                value={tokenAmount}
                onChange={(e) =>
                  setTokenAmount(parseFloat(e.currentTarget.value))
                }
              />
            )}

            <FormGroup>
              <FormControlLabel
                label="Escrowed"
                control={
                  <Checkbox
                    checked={escrowed}
                    onClick={() => setEscrowed(!escrowed)}
                  />
                }
              />
            </FormGroup>
            <Button
              size="small"
              fullWidth
              variant="contained"
              onClick={() => addOffering("NFT")}
              disabled={isLoading}
              sx={{
                mb: 2,
                backgroundColor: "#349bc6",
                fontFamily: "Rubik",
                textTransform: "none",
                boxShadow: "#397f9d7a 0px 8px 16px 0px!important",
                borderRadius: "10px !important",
                "&:hover": {
                  boxShadow: "none !important",
                  backgroundColor: "#ff714f14",
                },
              }}
            >
              Add Token Offering
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
            width: "100%",
            maxWidth: "300px",
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

            <FormControl size="small" fullWidth sx={{ width: "100%", mb: 1 }}>
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

            <FormGroup>
              <FormControlLabel
                label="Is Escrowed"
                control={<Checkbox checked={selectedOffering?.isEscrowed} />}
                sx={{ mb: 1 }}
              />
            </FormGroup>

            <Button
              fullWidth
              variant="contained"
              sx={{
                mb: 2,
                backgroundColor: "#349bc6",
                fontFamily: "Rubik",
                textTransform: "none",
                boxShadow: "#397f9d7a 0px 8px 16px 0px!important",
                borderRadius: "10px !important",
                "&:hover": {
                  boxShadow: "none !important",
                  backgroundColor: "#ff714f14",
                },
              }}
              onClick={() => removeOffering()}
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
