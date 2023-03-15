import { FC, useState } from "react";
import { Metaplex, walletAdapterIdentity } from "@metaplex-foundation/js";
import { Wallet } from "@ludex-labs/ludex-sdk-js/web3/solana/utils";
import { clusterApiUrl, Connection, PublicKey } from "@solana/web3.js";
import { Box, Button, Dialog, DialogTitle, TextField } from "@mui/material";
import { toast } from "react-hot-toast";

const connection = new Connection(clusterApiUrl("devnet"));
const metaplex = Metaplex.make(connection);

export const NFTMint: FC<{
  publicKey: string;
  wallet?: Wallet;
  connection: Connection;
  openMint: boolean;
  setOpenMint: (open: boolean) => void;
}> = (props) => {
  const { publicKey, wallet, openMint, setOpenMint } = props;

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
                name: name,
                symbol: symbol,
                sellerFeeBasisPoints: 10,
                uri: uri,
                tokenOwner: pk,
              });

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
    <Dialog
      className="dark-dialog"
      onClose={() => setOpenMint(false)}
      open={openMint}
    >
      <Box sx={{ minWidth: "300px" }}>
        <DialogTitle
          sx={{
            textAlign: "center",
            fontFamily: "Rubik !important",
            fontWeight: 400,
          }}
        >
          {" "}
          Mint Test NFT
        </DialogTitle>
        <Box
          sx={{
            display: "flex",
            flexDirection: "column",
          }}
        >
          <TextField
            fullWidth
            size="small"
            label="Name"
            sx={{ mb: 3 }}
            value={name}
            disabled={isLoading}
            onChange={(e) => setName(e.target.value)}
          />
          <TextField
            fullWidth
            size="small"
            label="Symbol"
            sx={{ mb: 3 }}
            value={symbol}
            disabled={isLoading}
            onChange={(e) => setSymbol(e.target.value)}
          />
          <TextField
            fullWidth
            size="small"
            label="URI"
            sx={{ mb: 3 }}
            value={uri}
            disabled={isLoading}
            onChange={(e) => setUri(e.target.value)}
          />

          <Button
            disabled={isLoading}
            variant="contained"
            onClick={() => mintNft()}
            sx={{
              backgroundColor: "#ff714f",
              mt: 1,
              fontFamily: "Rubik",
              textTransform: "none",
              boxShadow: "rgba(255, 113, 79, 0.24) 0px 8px 16px 0px",
              borderRadius: "8px !important",
              "&:hover": {
                boxShadow: "none !important",
                backgroundColor: "#ff714f14",
              },
            }}
          >
            Mint NFT
          </Button>
        </Box>
      </Box>
    </Dialog>
  );
};
