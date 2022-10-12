import "@shardlabs/starknet-hardhat-plugin";

module.exports = {
  starknet: {
    venv: "active",
    network: "local", // change to "alpha-mainnet" for mainnet
  },
  networks: {
    local: {
      url: "http://127.0.0.1:5050"
    }
  },
  wallets: {
    MyWallet: {
      accountName: "OpenZeppelin",
      modulePath: "starkware.starknet.wallets.open_zeppelin.OpenZeppelinAccount",
      accountPath: "~/.starknet_accounts"
    },
  }
};
