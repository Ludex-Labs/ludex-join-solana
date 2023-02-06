/* eslint-disable react-hooks/exhaustive-deps */
import { useEffect, useState } from "react";
import { Wallet } from "@ludex-labs/ludex-sdk-js/lib/web3/utils";
import { Join } from "./Join";
import { WalletSolana } from "./WalletSolana";
import WalletIcon from "@mui/icons-material/Wallet";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import { Box, IconButton, Button } from "@mui/material";
import { toast } from "react-hot-toast";

// Web3Auth
import { Web3Auth } from "@web3auth/modal";
import { CHAIN_NAMESPACES, SafeEventEmitterProvider } from "@web3auth/base";
import { OpenloginAdapter } from "@web3auth/openlogin-adapter";
import RPC from "../Polygon/RPC";

// Solana
import {
  SolanaPrivateKeyProvider,
  SolanaWallet,
} from "@web3auth/solana-provider";
import { Connection, Transaction, PublicKey } from "@solana/web3.js";

export const Solana = (props: any) => {
  const [viewWallet, setViewWallet] = useState(false);
  const [wallet, setWallet] = useState<Wallet | undefined>();
  const [publicKey, setPublicKey] = useState("");
  const [web3auth, setWeb3auth] = useState<Web3Auth | null>(null);
  const [provider, setProvider] = useState<SafeEventEmitterProvider | null>(
    null
  );
  const [providerSolana, setProviderSolana] =
    useState<SafeEventEmitterProvider | null>(null);
  const [network, setNetwork] = useState("");
  const [connection, setConnection] = useState<Connection | null>(null);

  const isMainnet = network.includes("winter-little");

  const chainConfigSolana = {
    chainNamespace: CHAIN_NAMESPACES.SOLANA,
    chainId: isMainnet ? "0x3" : "0x1",
    //rpcTarget: "https://rpc.ankr.com/solana"
    rpcTarget:
      isMainnet && process.env.REACT_APP_SOLANA_RPC_MAINNET != null
        ? process.env.REACT_APP_SOLANA_RPC_MAINNET
        : process.env.REACT_APP_SOLANA_RPC || "",
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
        setupSolana();
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
    if (!wallet || !providerSolana) setupSolana();
  }, [connection, wallet, providerSolana]);

  useEffect(() => {
    if (publicKey === "" && getSolanaAddress) getSolanaAddress();
  }, [connection]);

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
    setProviderSolana(null);
    setViewWallet(false);
    toast.success("Logged out!");
  };

  const getSolanaAddress = async () => {
    if (!provider) {
      console.error("provider not initialized yet");
      return;
    }
    const rpc = new RPC(provider);
    const privateKey = await rpc.getPrivateKey();
    const { getED25519Key } = await import("@toruslabs/openlogin-ed25519");
    const ed25519key = getED25519Key(privateKey).sk.toString("hex");
    const solanaPrivateKeyProvider = new SolanaPrivateKeyProvider({
      config: {
        chainConfig: {
          chainId: isMainnet ? "0x3" : "0x1",
          //rpcTarget: "https://rpc.ankr.com/solana",
          rpcTarget:
            isMainnet && process.env.REACT_APP_SOLANA_RPC_MAINNET != null
              ? process.env.REACT_APP_SOLANA_RPC_MAINNET
              : process.env.REACT_APP_SOLANA_RPC || "",
          displayName: "Solana Mainnet",
          blockExplorer: "https://explorer.solana.com/",
          ticker: "SOL",
          tickerName: "Solana",
        },
      },
    });
    await solanaPrivateKeyProvider.setupProvider(ed25519key);
    setProviderSolana(solanaPrivateKeyProvider.provider);
    const solanaWallet = new SolanaWallet(
      solanaPrivateKeyProvider.provider as any
    );
    const solana_address = await solanaWallet.requestAccounts();
    setPublicKey(solana_address[0]);
    const wallet = {
      signTransaction: (transaction: Transaction) => {
        return solanaWallet.signTransaction(transaction);
      },
      signAllTransactions: (transactions: any) => {
        return solanaWallet.signAllTransactions(transactions);
      },
      publicKey: new PublicKey(solana_address[0]),
    };
    setWallet(wallet);
    return;
  };

  const setupSolana = async () => {
    if (!web3auth?.provider) return;
    setProviderSolana(web3auth?.provider);
    const solanaWallet = new SolanaWallet(web3auth.provider);
    const solana_address = await solanaWallet.requestAccounts();
    setPublicKey(solana_address[0]);
    const wallet = {
      signTransaction: (transaction: Transaction) => {
        return solanaWallet.signTransaction(transaction);
      },
      signAllTransactions: (transactions: any) => {
        return solanaWallet.signAllTransactions(transactions);
      },
      publicKey: new PublicKey(solana_address[0]),
    };
    setWallet(wallet);
  };

  const changeNetwork = async (network: string) => {
    if (
      network.toLowerCase() === "devnet" &&
      process.env.REACT_APP_SOLANA_RPC
    ) {
      const connection = new Connection(process.env.REACT_APP_SOLANA_RPC || "");
      setConnection(connection);
      setNetwork(process.env.REACT_APP_SOLANA_RPC);
    } else if (
      network.toLowerCase() === "mainnet" &&
      process.env.REACT_APP_SOLANA_RPC_MAINNET
    ) {
      const connection = new Connection(
        process.env.REACT_APP_SOLANA_RPC_MAINNET || ""
      );
      setConnection(connection);
      setNetwork(process.env.REACT_APP_SOLANA_RPC_MAINNET);
    }
  };

  const sendTransaction = async (transaction: Transaction): Promise<string> => {
    try {
      if (!providerSolana) {
        console.error("provider not initialized yet");
        return "";
      }
      const solanaWallet = new SolanaWallet(providerSolana);
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
        {providerSolana && viewWallet && connection ? (
          <WalletSolana
            publicKey={publicKey}
            provider={providerSolana}
            network={network}
            changeNetwork={changeNetwork}
            isMainnet={isMainnet}
            sendTransaction={sendTransaction}
            connection={connection}
            wallet={wallet}
            logout={logout}
          />
        ) : providerSolana && connection != null ? (
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
          {viewWallet ? (
            <IconButton onClick={() => setViewWallet(!viewWallet)}>
              <ArrowBackIcon />
            </IconButton>
          ) : (
            <IconButton onClick={() => setViewWallet(!viewWallet)}>
              <WalletIcon />
            </IconButton>
          )}
        </Box>
      )}
    </>
  );
};
