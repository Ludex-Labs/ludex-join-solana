/* eslint-disable react-hooks/exhaustive-deps */
import { useEffect, useState } from "react";
import { toast } from "react-hot-toast";
import { Wallet } from "@ludex-labs/ludex-sdk-js/lib/web3/utils";
import { Join } from "./Join";
import { WalletSolana } from "./WalletSolana";
import { Connection, Transaction, PublicKey } from "@solana/web3.js";
import { RPC } from "./RPC";

// Web3Auth
import { Web3Auth } from "@web3auth/modal";
import { CHAIN_NAMESPACES, SafeEventEmitterProvider } from "@web3auth/base";
import { OpenloginAdapter } from "@web3auth/openlogin-adapter";
import { SolanaWallet } from "@web3auth/solana-provider";

// MUI
import WalletIcon from "@mui/icons-material/Wallet";
import { Box, IconButton, Button } from "@mui/material";

export const Solana = (props: any) => {
  const [web3auth, setWeb3auth] = useState<Web3Auth | null>(null);
  const [provider, setProvider] = useState<SafeEventEmitterProvider | null>(
    null
  );

  const [wallet, setWallet] = useState<Wallet | undefined>();
  const [publicKey, setPublicKey] = useState("");
  const [viewWallet, setViewWallet] = useState(false);

  const [connection, setConnection] = useState<Connection | null>(null);
  const [isMainnet, setIsMainnet] = useState<boolean>(false);

  const chainConfigSolana = {
    chainNamespace: CHAIN_NAMESPACES.SOLANA,
    chainId: isMainnet ? "0x3" : "0x1",
    rpcTarget:
      isMainnet && process.env.REACT_APP_SOLANA_RPC_MAINNET != null
        ? process.env.REACT_APP_SOLANA_RPC_MAINNET
        : process.env.REACT_APP_SOLANA_RPC || "https://rpc.ankr.com/solana",
    displayName: "Solana Mainnet",
    blockExplorer: "https://explorer.solana.com/",
    ticker: "SOL",
    tickerName: "Solana",
  };

  const initWeb3Auth = async () => {
    try {
      const web3auth = new Web3Auth({
        clientId:
          "BN9RRuk_E8For7JFZp-Q6uDhboz0_qmSvEBtY65arWFNxZ4xdiv3dr_7mtKMw2n-w5HU1mQ7XyVUWn7EJeDEeXg",
        chainConfig: chainConfigSolana,
        uiConfig: {
          theme: "dark",
          loginMethodsOrder: ["google"],
          appLogo: "https://ludex.gg/logo/logo.svg",
        },
      });
      setWeb3auth(web3auth);
      const openloginAdapter = new OpenloginAdapter({
        loginSettings: {
          mfaLevel: "optional",
        },
      });
      web3auth.configureAdapter(openloginAdapter);
      await web3auth.initModal();

      if (web3auth.provider) {
        setProvider(web3auth.provider);
        getWallet();
        changeNetwork("devnet");
      }
    } catch (error) {
      console.error(error);
    }
  };

  useEffect(() => {
    initWeb3Auth();
  }, []);

  useEffect(() => {
    if (!wallet || !provider) getWallet();
  }, [connection, wallet, provider]);

  const login = async () => {
    if (!web3auth) {
      console.error("web3auth not initialized yet");
      return;
    }
    const web3authProvider = await web3auth.connect();
    await setProvider(web3authProvider);
    await changeNetwork("devnet");
    toast.success("Logged in Successfully!");
  };

  const logout = async () => {
    if (!web3auth) {
      console.error("web3auth not initialized yet");
      return;
    }
    await web3auth.logout();
    setProvider(null);
    setViewWallet(false);
    toast.success("Logged out!");
  };

  const getWallet = async () => {
    if (!web3auth?.provider) {
      console.error("provider not initialized yet");
      return;
    }
    const rpc = new RPC(web3auth?.provider);
    const wallet = await rpc.getWallet();
    setWallet(wallet);

    const publicKey = await rpc.getAccounts();
    setPublicKey(publicKey[0]);
  };

  const changeNetwork = async (network: string) => {
    const isMainnet = network === "mainnet";
    var connection;
    if (!isMainnet) {
      connection = new Connection(
        process.env.REACT_APP_SOLANA_RPC || "https://rpc.ankr.com/solana"
      );
    } else if (isMainnet) {
      connection = new Connection(
        process.env.REACT_APP_SOLANA_RPC_MAINNET ||
          "https://rpc.ankr.com/solana"
      );
    }
    setConnection(connection || null);
    setIsMainnet(isMainnet);
  };

  const sendTransaction = async (transaction: Transaction): Promise<string> => {
    try {
      if (!provider) {
        console.error("provider not initialized yet");
        return "";
      }
      const solanaWallet = new SolanaWallet(provider);
      transaction = await solanaWallet.signTransaction(transaction);
      if (connection) {
        const signature = await connection.sendRawTransaction(
          transaction.serialize()
        );
        return signature;
      }
      return "";
    } catch (error) {
      return error as string;
    }
  };

  return (
    <>
      <img alt="solana" src="./assets/solana.svg" className="chain-container" />
      <Box className="join-container">
        {provider && viewWallet && connection ? (
          <WalletSolana
            publicKey={publicKey}
            provider={provider}
            changeNetwork={changeNetwork}
            isMainnet={isMainnet}
            sendTransaction={sendTransaction}
            connection={connection}
            wallet={wallet}
            logout={logout}
          />
        ) : provider && connection != null ? (
          <Join
            publicKey={publicKey}
            wallet={wallet}
            sendTransaction={sendTransaction}
            isMainnet={isMainnet}
            changeNetwork={changeNetwork}
            connection={connection}
          />
        ) : (
          <Button variant={"contained"} onClick={() => login()}>
            Sign In
          </Button>
        )}
      </Box>

      {provider && (
        <Box sx={{ mt: 3 }}>
          <IconButton onClick={() => setViewWallet(!viewWallet)}>
            <WalletIcon />
          </IconButton>
        </Box>
      )}
    </>
  );
};
