/* eslint-disable react-hooks/exhaustive-deps */
import { useEffect, useState } from "react";
import { toast } from "react-hot-toast";
import { Wallet } from "@ludex-labs/ludex-sdk-js/lib/web3/utils";
import { Join } from "./Join";
import { WalletSolana } from "./WalletSolana";
import { Connection } from "@solana/web3.js";
import { RPC } from "./RPC";

// Web3Auth
import { Web3Auth } from "@web3auth/modal";
import { CHAIN_NAMESPACES, SafeEventEmitterProvider } from "@web3auth/base";
import { OpenloginAdapter } from "@web3auth/openlogin-adapter";

// MUI
import WalletIcon from "@mui/icons-material/Wallet";
import { Button, IconButton } from "@mui/material";

export const Solana = () => {
  const [web3auth, setWeb3auth] = useState<Web3Auth | null>(null);
  const [provider, setProvider] = useState<SafeEventEmitterProvider | null>(
    null
  );
  const [connection, setConnection] = useState<Connection | null>(null);
  const [isMainnet, setIsMainnet] = useState<boolean>(false);
  const [wallet, setWallet] = useState<Wallet | undefined>();
  const [viewWallet, setViewWallet] = useState(false);

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
  };

  const changeNetwork = async (network: string) => {
    const isMainnet = network === "mainnet";
    var connection = new Connection(
      isMainnet && process.env.REACT_APP_SOLANA_RPC_MAINNET != null
        ? process.env.REACT_APP_SOLANA_RPC_MAINNET
        : process.env.REACT_APP_SOLANA_RPC || "https://rpc.ankr.com/solana"
    );
    setConnection(connection || null);
    setIsMainnet(isMainnet);
  };

  return (
    <>
      <img alt="solana" src="./assets/solana.svg" className="chain-container" />
      <span className="join-container">
        {provider && connection && viewWallet ? (
          <WalletSolana
            publicKey={wallet?.publicKey?.toString() || ""}
            provider={provider}
            wallet={wallet}
            isMainnet={isMainnet}
            connection={connection}
            changeNetwork={changeNetwork}
            logout={logout}
          />
        ) : provider && connection != null ? (
          <Join
            publicKey={wallet?.publicKey?.toString() || ""}
            provider={provider}
            wallet={wallet}
            isMainnet={isMainnet}
            connection={connection}
            changeNetwork={changeNetwork}
          />
        ) : (
          <Button variant={"contained"} onClick={() => login()}>
            Sign In
          </Button>
        )}
      </span>

      {provider && (
        <IconButton onClick={() => setViewWallet(!viewWallet)} sx={{ mt: 2 }}>
          <WalletIcon />
        </IconButton>
      )}
    </>
  );
};
