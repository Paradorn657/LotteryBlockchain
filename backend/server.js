const express = require("express");
const { ethers } = require("ethers");

const cron = require("node-cron");
const cors = require("cors");


const app = express();
app.use(cors()); // เพื่อให้ Next.js เรียก API ได้
app.use(express.json());

const provider = new ethers.JsonRpcProvider("http://127.0.0.1:7545"); // ใช้ Ganache หรือ Hardhat
const contractAddress = "0xc77C586AD45EbB7f8a0473d6cF64d23162A392B8"; // ใส่ address ที่ deploy แล้ว
const lotteryABI = require("../contract/artifacts/contracts/Lottery.sol/Lottery.json").abi;

const wallet = new ethers.Wallet("0xb6903c1fbc738c0578ff6dc5990430bc543e2391d1a0a43f05276e3400fabd27", provider); // ใช้ private key ที่คุณมี
const lotteryContract = new ethers.Contract(contractAddress, lotteryABI, wallet);
async function autoGenerateLottery() {
    try {
      const tx = await lotteryContract.generateLottery(10);
      await tx.wait();
      console.log("Lottery round generated successfully!");
    } catch (error) {
      console.error("Error generating lottery:", error);
    }
  }
  
  cron.schedule("* * * * *", () => {
    console.log("Generating new lottery round...");
    autoGenerateLottery();
  });

// ดึงเลขหวยของงวดที่กำหนด
app.get("/api/tickets/:roundId", async (req, res) => {
  try {
    const { roundId } = req.params;
    
    const tickets = await lotteryContract.getTicketsByRound(roundId);
    // แปลง BigInt ให้เป็น String ก่อนส่งไปที่ frontend
    const ticketsStringified = tickets.map(ticket => ticket.toString());
    res.json({ roundId, tickets: ticketsStringified });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ดึงงวดล่าสุด
app.get("/api/latest-round", async (req, res) => {
  try {
    const roundId = await lotteryContract.getLatestRoundId();

    res.json({ roundId:roundId.toString() });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// เปิด Server
const PORT = 5000;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
