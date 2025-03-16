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
  }
};

export default config;
