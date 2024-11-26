const WalletConnect = require("@walletconnect/client");
const Web3 = require("web3");
const ethers = require("ethers");

let connector;

const initializeWalletConnect = () => {
  connector = new WalletConnect({
    bridge: "https://bridge.walletconnect.org", // Required
  });

  if (!connector.connected) {
    connector.createSession();
  }

  // Event: Connection established
  connector.on("connect", (error, payload) => {
    if (error) throw error;
    console.log("Wallet connected:", payload.params[0].accounts);
  });

  // Event: Session updated
  connector.on("session_update", (error, payload) => {
    if (error) throw error;
    console.log("Session updated:", payload.params[0]);
  });

  // Event: Disconnected
  connector.on("disconnect", (error, payload) => {
    if (error) throw error;
    console.log("Wallet disconnected");
  });
};

const sendRewards = async (userWallet, amount) => {
  try {
    if (!connector.connected) {
      throw new Error("Wallet not connected");
    }

    const provider = new ethers.providers.JsonRpcProvider(
      process.env.ETH_RPC_URL
    );
    const signer = provider.getSigner(process.env.ADMIN_WALLET);

    const tx = await signer.sendTransaction({
      to: userWallet,
      value: ethers.utils.parseEther(amount.toString()), // Amount in ETH
    });

    console.log("Transaction sent:", tx.hash);
    return tx.hash;
  } catch (error) {
    console.error("Error sending rewards:", error);
    throw error;
  }
};

module.exports = { initializeWalletConnect, sendRewards };
