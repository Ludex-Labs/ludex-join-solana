import { FC, useState } from "react";
import { Metaplex, walletAdapterIdentity } from "@metaplex-foundation/js";
import { Wallet } from "@ludex-labs/ludex-sdk-js/lib/web3/utils";
import {
  clusterApiUrl,
  Connection,
  Transaction,
  PublicKey,
} from "@solana/web3.js";
import { Button, Typography, TextField, Box, Divider } from "@mui/material";
import { toast } from "react-hot-toast";

const connection = new Connection(clusterApiUrl("devnet"));
const metaplex = Metaplex.make(connection);

export const NFTMint: FC<{
  publicKey: string;
  wallet?: Wallet;
  sendTransaction?: (tx: Transaction) => Promise<string>;
  connection: Connection;
}> = (props) => {
  const { publicKey, wallet } = props;

  const [isLoading, setIsLoading] = useState(false);
  const [name, setName] = useState("My NFT");
  const [symbol, setSymbol] = useState("MNFT");
  const [uri, setUri] = useState(
    "https://arweave.net/VuAKyW8PhDI2YbHuKzB1tS-gFWvbSLUkytrDq0A8TNY"
  );

  const mintNft = async () => {
    try {
      await toast.promise(
        Promise.resolve(
          (async () => {
            try {
              setIsLoading(true);
              if (wallet === undefined) return;
              metaplex.use(walletAdapterIdentity(wallet));
              const pk = new PublicKey(publicKey);
              const nft = await metaplex.nfts().create({
                name: "My NFT",
                symbol: "MNFT",
                sellerFeeBasisPoints: 10,
                uri: "https://arweave.net/VuAKyW8PhDI2YbHuKzB1tS-gFWvbSLUkytrDq0A8TNY",
                // payer: fromWallet,
                tokenOwner: pk,
              });
              // .run();

              console.info("NFT: ", nft);
              setIsLoading(false);
              return;
            } catch (e) {
              throw e;
            }
          })()
        ),
        {
          loading: "NFT minting...",
          success: "NFT minted!",
          error: "NFT minted failed!",
        }
      );
    } catch (error) {
      setIsLoading(false);
      console.error(error);
    }
  };

  return (
    <Box>
      <Divider sx={{ mb: 3, mt: 3 }} />
      <Typography variant={"h6"} sx={{ mb: 2 }}>
        Mint Test NFT
      </Typography>
      <TextField
        fullWidth
        size="small"
        label="Name"
        sx={{ mb: 2 }}
        value={name}
        disabled={isLoading}
        onChange={(e) => setName(e.target.value)}
      />
      <TextField
        fullWidth
        size="small"
        label="Symbol"
        sx={{ mb: 2 }}
        value={symbol}
        disabled={isLoading}
        onChange={(e) => setSymbol(e.target.value)}
      />
      <TextField
        fullWidth
        size="small"
        label="URI"
        sx={{ mb: 2 }}
        value={uri}
        disabled={isLoading}
        onChange={(e) => setUri(e.target.value)}
      />

      <Button
        disabled={isLoading}
        variant="contained"
        onClick={() => mintNft()}
        sx={{ m: 1 }}
      >
        Mint NFT
      </Button>
    </Box>
  );
};
