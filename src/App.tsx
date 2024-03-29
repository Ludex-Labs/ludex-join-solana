import "./App.css";
import { useEffect, useState } from "react";
import { toast } from "react-hot-toast";
import { Toaster } from "react-hot-toast";
import { Sign } from "./Solana/Sign";
import { CreateVaultAccount } from "./Solana/CreateVaultAccount";
import { Join } from "./Solana/Join";
import { RPC } from "./Solana/RPC";
import { WalletSolana } from "./Solana/WalletSolana";
import { Footer } from "./Solana/Footer";
import { Connection } from "@solana/web3.js";
import { Wallet } from "@ludex-labs/ludex-sdk-js/web3/solana/utils";
import { Box, Button } from "@mui/material";

// @ts-ignore
import StarfieldAnimation from "react-starfield-animation";

// Web3Auth
import { Web3Auth } from "@web3auth/modal";
import { OpenloginAdapter } from "@web3auth/openlogin-adapter";
import { CHAIN_NAMESPACES, SafeEventEmitterProvider } from "@web3auth/base";

function App() {
  const [viewWallet, setViewWallet] = useState<boolean>(false);
  const [isMainnet, setIsMainnet] = useState<boolean>(false);
  const [wallet, setWallet] = useState<Wallet | undefined>();
  const [connection, setConnection] = useState<Connection | null>(null);
  const [web3auth, setWeb3auth] = useState<Web3Auth | null>(null);
  const [provider, setProvider] = useState<SafeEventEmitterProvider | null>(
    null
  );
  const [tx, setTx] = useState<string>("");
  const [vaultAddress, setVaultAddress] = useState<string>("");

  useEffect(() => {
    (async () => {
      const params = new URLSearchParams(window.location.search);
      const _tx = params.get("tx");
      if (_tx && _tx?.length > 0) {
        const decoded = decodeURIComponent(_tx);
        setTx(decoded);
      }

      const _vaultAddress = params.get("vaultAddress");
      if (_vaultAddress && _vaultAddress?.length > 0)
        setVaultAddress(_vaultAddress);
    })();
  }, []);

  useEffect(() => {
    const initWeb3Auth = async () => {
      try {
        const web3auth = new Web3Auth({
          clientId:
            "BN9RRuk_E8For7JFZp-Q6uDhboz0_qmSvEBtY65arWFNxZ4xdiv3dr_7mtKMw2n-w5HU1mQ7XyVUWn7EJeDEeXg",
          chainConfig: {
            chainNamespace: CHAIN_NAMESPACES.SOLANA,
            chainId: isMainnet ? "0x3" : "0x1",
            rpcTarget: isMainnet
              ? process.env.REACT_APP_SOLANA_RPC_MAINNET ||
                "https://api.mainnet-beta.solana.com"
              : process.env.REACT_APP_SOLANA_RPC ||
                "https://api.devnet.solana.com",
          },
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
        web3auth.initModal();

        if (web3auth.provider) {
          setProvider(web3auth.provider);
          changeNetwork("devnet");
        }
      } catch (error) {
        console.error(error);
      }
    };

    if (!web3auth) initWeb3Auth();
  }, [isMainnet, web3auth]);

  useEffect(() => {
    const getWallet = async () => {
      if (!provider) {
        console.error("provider not initialized yet");
        return;
      }
      const rpc = new RPC(provider);
      const wallet = await rpc.getWallet();
      setWallet(wallet);
    };

    if (!wallet && provider) getWallet();
  }, [provider, wallet]);

  const changeNetwork = async (network: string) => {
    const isMainnet = network === "mainnet";
    var connection = new Connection(
      isMainnet
        ? process.env.REACT_APP_SOLANA_RPC_MAINNET ||
          "https://api.mainnet-beta.solana.com"
        : process.env.REACT_APP_SOLANA_RPC || "https://api.devnet.solana.com"
    );
    setConnection(connection || null);
    setIsMainnet(isMainnet);
  };

  const login = async () => {
    if (!web3auth) {
      console.error("web3auth not initialized yet");
      return;
    }
    const web3authProvider = await web3auth.connect();
    setProvider(web3authProvider);
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

  return (
    <Box className="app">
      <StarfieldAnimation
        style={{
          position: "absolute",
          width: "100%",
          height: "100%",
        }}
      />
      <Toaster />
      <Box className="container-page">
        <span className="join-container">
          {!connection && (
            <>
              <Box sx={{ mb: 2, width: "80%" }}>
                <img
                  src="../assets/ludex-logo.svg"
                  alt="Ludex"
                  className="logo"
                />
              </Box>
              <Box sx={{ fontSize: "20px", mb: 3 }}>
                Click the button
                <br /> below to sign in
              </Box>
            </>
          )}
          {provider && viewWallet && connection ? (
            <WalletSolana
              publicKey={wallet?.publicKey?.toString() || ""}
              provider={provider}
              wallet={wallet}
              isMainnet={isMainnet}
              connection={connection}
              changeNetwork={changeNetwork}
              logout={logout}
            />
          ) : tx.length > 0 && provider && connection != null ? (
            <Sign
              tx={tx}
              provider={provider}
              connection={connection}
              isMainnet={isMainnet}
              changeNetwork={changeNetwork}
            />
          ) : vaultAddress.length > 0 && provider && connection != null ? (
            <CreateVaultAccount
              vaultAddress={vaultAddress}
              publicKey={wallet?.publicKey?.toString() || ""}
              provider={provider}
              connection={connection}
              isMainnet={isMainnet}
              changeNetwork={changeNetwork}
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
            <Button
              className="btn-login"
              variant={"contained"}
              size="large"
              sx={{ width: "100%" }}
              onClick={() => login()}
            >
              Sign In
            </Button>
          )}

          {provider && (
            <Footer setViewWallet={setViewWallet} viewWallet={viewWallet} />
          )}
        </span>
      </Box>
    </Box>
  );
}

export default App;
