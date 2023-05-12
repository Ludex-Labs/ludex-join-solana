import { Wallet } from "@ludex-labs/ludex-sdk-js/web3/solana/utils";
import { SafeEventEmitterProvider } from "@web3auth/base";
import { SolanaWallet } from "@web3auth/solana-provider";
import { toast } from "react-hot-toast";
import {
  Connection,
  LAMPORTS_PER_SOL,
  PublicKey,
  Transaction,
} from "@solana/web3.js";

export class RPC {
  private provider: SafeEventEmitterProvider;
  constructor(provider: SafeEventEmitterProvider) {
    this.provider = provider;
  }

  getAccounts = async (): Promise<string[]> => {
    try {
      const solanaWallet = new SolanaWallet(this.provider);
      const acc = await solanaWallet.requestAccounts();
      return acc;
    } catch (error) {
      return error as string[];
    }
  };

  getBalance = async (connection: Connection): Promise<string> => {
    try {
      const solanaWallet = new SolanaWallet(this.provider);
      const accounts = await solanaWallet.requestAccounts();
      const balance = await connection.getBalance(new PublicKey(accounts[0]));
      return balance.toString();
    } catch (error) {
      return error as string;
    }
  };

  signMessage = async (): Promise<string> => {
    try {
      const solanaWallet = new SolanaWallet(this.provider);
      const msg = Buffer.from("Test Signing Message ", "utf8");
      const res = await solanaWallet.signMessage(msg);
      return res.toString();
    } catch (error) {
      return error as string;
    }
  };

  sendTransaction = async (transaction: Transaction): Promise<string> => {
    try {
      const solanaWallet = new SolanaWallet(this.provider);
      const { signature } = await solanaWallet.signAndSendTransaction(
        transaction
      );
      return signature;
    } catch (error) {
      return error as string;
    }
  };

  signTransaction = async (transaction: Transaction): Promise<Transaction> => {
    try {
      const solanaWallet = new SolanaWallet(this.provider);
      const tx = await solanaWallet.signTransaction(transaction);
      return tx;
    } catch (error) {
      throw error;
    }
  };

  getWallet = async (): Promise<Wallet> => {
    const solanaWallet = new SolanaWallet(this.provider);
    return {
      signTransaction: (transaction) => {
        return solanaWallet.signTransaction(transaction);
      },
      signAllTransactions: (transactions) => {
        return solanaWallet.signAllTransactions(transactions);
      },
      publicKey: new PublicKey((await this.getAccounts())[0]),
    };
  };

  getPrivateKey = async (): Promise<string> => {
    // const privateKey = await this.provider.request({
    //   method: "private_key",
    //   params: {},
    // });

    const privateKey = await this.provider.request({
      method: "solanaPrivateKey",
    });

    console.log(privateKey);

    return privateKey as string;
  };
}

export const getTestSol = async (publicKey: string) => {
  try {
    const _publicKey = new PublicKey(publicKey);
    const connection = new Connection("https://api.devnet.solana.com/");
    await toast.promise(
      Promise.resolve(
        (async () => {
          try {
            console.log("LAMPORTS_PER_SOL", LAMPORTS_PER_SOL);
            const airdropSignature = await connection.requestAirdrop(
              _publicKey,
              LAMPORTS_PER_SOL
            );
            console.log("airdropSignature", airdropSignature);
            const airdropSig = await connection.confirmTransaction(
              airdropSignature
            );
            console.log("airdropSig", airdropSig);
            return;
          } catch (e) {
            throw e;
          }
        })()
      ),
      {
        loading: "Requesting 1 SOL for tests. It's free!",
        success: "Requested SOL successfully!",
        error: "Requesting SOL failed!",
      }
    );
  } catch (error) {
    console.error(error);
  }
};

export const viewTokenAccounts = async (
  provider: SafeEventEmitterProvider,
  publicKey: string,
  connection: Connection
) => {
  try {
    if (provider === null) return;
    const _publicKey = new PublicKey(publicKey);
    const splToken = await import("@solana/spl-token");
    let tokenAccounts = await connection.getParsedTokenAccountsByOwner(
      _publicKey,
      {
        programId: splToken.TOKEN_PROGRAM_ID,
      }
    );
    return tokenAccounts;
  } catch (error) {
    console.error(error);
  }
};

export const importToken = async (
  provider: SafeEventEmitterProvider,
  publicKey: string,
  connection: Connection,
  tokenToImport: string
) => {
  try {
    if (provider === null) return;
    const solanaWallet = new SolanaWallet(provider);
    const mintPubkey = new PublicKey(tokenToImport);
    const _publicKey = new PublicKey(publicKey);
    const splToken = await import("@solana/spl-token");
    let ata = await splToken.getAssociatedTokenAddress(
      mintPubkey,
      _publicKey,
      true
    );
    // eslint-disable-next-line prefer-destructuring
    const blockhash = (await connection.getLatestBlockhash()).blockhash;
    const tx = new Transaction().add(
      splToken.createAssociatedTokenAccountInstruction(
        _publicKey,
        ata,
        _publicKey,
        mintPubkey
      )
    );
    tx.feePayer = _publicKey;
    tx.recentBlockhash = blockhash;
    const signed_tx = await solanaWallet.signTransaction(tx);
    const signature = await connection.sendRawTransaction(
      signed_tx.serialize(),
      {
        skipPreflight: true,
      }
    );
    console.log("signature", signature);
    toast.success("Import token success!");
    viewTokenAccounts(provider, publicKey, connection);
  } catch (error) {
    console.error(error);
  }
};
