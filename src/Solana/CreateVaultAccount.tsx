/* eslint-disable react-hooks/exhaustive-deps */
import { FC, useState } from "react";
import { Wallet } from "@ludex-labs/ludex-sdk-js/web3/solana/utils";
import { PublicKey, Transaction } from "@solana/web3.js";
import { SolanaWallet } from "@web3auth/solana-provider";
import { SafeEventEmitterProvider } from "@web3auth/base";
import AddIcon from "@mui/icons-material/Add";
import { toast } from "react-hot-toast";
import * as anchor from "@project-serum/anchor";

// MUI
import { Box, Button, Typography, TextField } from "@mui/material";

export const CreateVaultAccount: FC<{
  publicKey: string;
  provider: SafeEventEmitterProvider | null;
  wallet?: Wallet;
  changeNetwork: (network: string) => void;
  vaultAddress: string;
  connection: anchor.web3.Connection;
}> = (props) => {
  const {
    publicKey,
    provider,
    // wallet,
    connection,
    // changeNetwork,
    vaultAddress,
  } = props;
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [mint, setMint] = useState<string>(
    "So11111111111111111111111111111111111111112"
  );

  // const getOrCreateATA = async (
  //   connection: anchor.web3.Connection,
  //   tx: Transaction,
  //   owner: anchor.web3.PublicKey,
  //   mint: anchor.web3.PublicKey,
  //   payer: anchor.web3.PublicKey,
  //   offCurve = false,
  // ) => {
  //   const associatedTokenAddress = await Token.getAssociatedTokenAddress(
  //     ASSOCIATED_TOKEN_PROGRAM_ID,
  //     TOKEN_PROGRAM_ID,
  //     mint,
  //     owner,
  //     offCurve,
  //   );
  //   if (await tokenAccountIsInitialized(connection, token)) {
  //     return token;
  //   }

  //   tx.add(
  //     Token.createAssociatedTokenAccountInstruction(
  //       ASSOCIATED_TOKEN_PROGRAM_ID,
  //       TOKEN_PROGRAM_ID,
  //       mint,
  //       associatedTokenAddress,
  //       owner, // Vault Blockchain Address
  //       payer, // Who every is paying for the transaction
  //     ),
  //   );

  //   //sendTransaction(tx);
  //   return token;
  // };

  const createTokenAccount = async () => {
    if (!provider) return "";
    try {
      setIsLoading(true);
      if (provider === null) return;
      const _mintPubkey = new PublicKey(mint);
      const _publicKey = new PublicKey(publicKey);
      const _vaultPublicKey = new PublicKey(vaultAddress);
      const splToken = await import("@solana/spl-token");
      let ata = await splToken.getAssociatedTokenAddress(
        _mintPubkey,
        _publicKey,
        false
      );
      // eslint-disable-next-line prefer-destructuring
      const blockhash = (await connection.getLatestBlockhash()).blockhash;
      const tx = new Transaction().add(
        splToken.createAssociatedTokenAccountInstruction(
          _publicKey,
          ata,
          _vaultPublicKey,
          _mintPubkey
        )
      );
      tx.feePayer = _publicKey;
      tx.recentBlockhash = blockhash;
      const solanaWallet = new SolanaWallet(provider);
      const signed_tx = await solanaWallet.signTransaction(tx);
      const signature = await connection.sendRawTransaction(
        signed_tx.serialize(),
        {
          skipPreflight: true,
        }
      );
      console.info("signature", signature);
      toast.success("Token Account Created");
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
      <Typography variant={"h5"} sx={{ mb: 3.5 }}>
        Create Token Account for Vault
      </Typography>

      <TextField
        size="small"
        fullWidth
        label="Mint"
        value={mint}
        onChange={(e) => setMint(e.currentTarget.value)}
        sx={{ mb: 2, mt: 2 }}
      />

      <Button
        disabled={isLoading}
        onClick={() => createTokenAccount()}
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
        Create Account
      </Button>
    </Box>
  );
};
