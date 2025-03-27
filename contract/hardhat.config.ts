import { HardhatUserConfig } from "hardhat/config";

require("dotenv").config()
require("@nomiclabs/hardhat-ethers")

const { API_URL, PRIVATE_KEY } = process.env
const config: HardhatUserConfig = {
  solidity: "0.8.28",
  defaultNetwork: "ganache",
  networks: {
    ganache: {
      url: API_URL, // URL ของ Ganache
      accounts: [`${PRIVATE_KEY}`], // แทนที่ด้วย Private Key จาก Ganache
    },
    sepolia: {
      url:"https://eth-sepolia.g.alchemy.com/v2/n2zNN4QoCJ36bAZGxEqtK30a9pphKnaw",
      accounts: ["e26c996f8de39cd3a39198be4f7bafb4f7bc98bb0e1d3847aa75017a98116e11"]
    }
  }
};

export default config;
