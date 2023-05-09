import "./App.css";
import { useEffect, useState } from "react";
import { toast } from "react-hot-toast";
import { Toaster } from "react-hot-toast";
import { Redeem } from "./Solana/Redeem";
import { CreateVaultAccount } from "./Solana/CreateVaultAccount";
import { Join } from "./Solana/Join";
import { RPC } from "./Solana/RPC";
import { WalletSolana } from "./Solana/WalletSolana";
import { Connection } from "@solana/web3.js";
import { Wallet } from "@ludex-labs/ludex-sdk-js/web3/solana/utils";

// @ts-ignore
import StarfieldAnimation from "react-starfield-animation";

// Web3Auth
import { Web3Auth } from "@web3auth/modal";
import { OpenloginAdapter } from "@web3auth/openlogin-adapter";
import { CHAIN_NAMESPACES, SafeEventEmitterProvider } from "@web3auth/base";

// MUI
import WalletIcon from "@mui/icons-material/Wallet";
import { Box, Button, Divider } from "@mui/material";

function App() {
  const [viewWallet, setViewWallet] = useState<boolean>(false);
  const [isMainnet, setIsMainnet] = useState<boolean>(false);
  const [wallet, setWallet] = useState<Wallet | undefined>();
  const [connection, setConnection] = useState<Connection | null>(null);
  const [web3auth, setWeb3auth] = useState<Web3Auth | null>(null);
  const [provider, setProvider] = useState<SafeEventEmitterProvider | null>(
    null
  );
  const [redeem, setRedeem] = useState<string>("");
  const [vaultAddress, setVaultAddress] = useState<string>("");

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

  useEffect(() => {
    (async () => {
      const params = new URLSearchParams(window.location.search);
      const _redeem = params.get("redeem");
      if (_redeem && _redeem?.length > 0) {
        const decoded = decodeURIComponent(_redeem);
        console.log("decoded", decoded);
        setRedeem(decoded);
      }
    })();
  }, []);

  useEffect(() => {
    (async () => {
      const params = new URLSearchParams(window.location.search);
      const _vaultAddress = params.get("vaultAddress");
      if (_vaultAddress && _vaultAddress?.length > 0)
        setVaultAddress(_vaultAddress);
    })();
  }, []);

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
          ) : redeem.length > 0 && provider && connection != null ? (
            <Redeem
              publicKey={wallet?.publicKey?.toString() || ""}
              provider={provider}
              wallet={wallet}
              isMainnet={isMainnet}
              // connection={connection}
              changeNetwork={changeNetwork}
              redeem={redeem}
            />
          ) : vaultAddress.length > 0 && provider && connection != null ? (
            <CreateVaultAccount
              publicKey={wallet?.publicKey?.toString() || ""}
              provider={provider}
              wallet={wallet}
              changeNetwork={changeNetwork}
              vaultAddress={vaultAddress}
              connection={connection}
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
            <>
              <Box
                sx={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  width: "100%",
                }}
              >
                <Divider sx={{ mt: 2, mb: 0 }} variant="middle" />

                <Button
                  sx={{
                    minWidth: "250px",
                    backgroundColor: "#ff714f",
                    display: "flex",
                    alignItems: "center",
                    padding: "10px",
                    borderRadius: "10px",
                    marginTop: "1rem",
                    maxWidth: "290px",
                    height: "42.25px",
                    boxShadow: "#ff714f3d 0px 8px 16px 0px !important",
                    "&:hover": {
                      boxShadow: "none !important",
                    },
                  }}
                  onClick={() => setViewWallet(!viewWallet)}
                >
                  {!viewWallet && (
                    <WalletIcon sx={{ width: "25px", height: "25px" }} />
                  )}
                  <>
                    <Box
                      sx={{
                        fontFamily: "Rubik",
                        ml: viewWallet ? 0 : "5px",
                        fontSize: "15px",
                        fontWeight: 500,
                        textTransform: "none",
                      }}
                    >
                      {viewWallet ? "Back" : "Wallet"}
                    </Box>
                  </>
                </Button>
              </Box>

              <Box
                sx={{
                  mt: 2,
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                }}
              >
                <Box
                  sx={{
                    mb: 1,
                  }}
                >
                  POWERED BY
                </Box>
                <img
                  alt="solana"
                  src="./assets/solana-title.svg"
                  className="chain-container-1"
                />
              </Box>
            </>
          )}
        </span>
      </Box>
    </Box>
  );
}

export default App;
