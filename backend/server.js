const express = require("express");
const { ethers } = require("ethers");

const cron = require("node-cron");
const cors = require("cors");


const app = express();
app.use(cors()); // เพื่อให้ Next.js เรียก API ได้
app.use(express.json());

const provider = new ethers.JsonRpcProvider("http://127.0.0.1:7545"); // ใช้ Ganache หรือ Hardhat
const contractAddress = "0x85BF69a81bdBdA7D8D000Bd2b201064444979D37"; // ใส่ address ที่ deploy แล้ว
const lotteryABI = require("../contract/artifacts/contracts/Lottery.sol/Lottery.json").abi;
//ใช้ private key เพื่อสร้าง wallet เอาไว้บอกเจ้าของ
const wallet = new ethers.Wallet("0xd38ff8a71036c601691308593d9b2e2eabeba2186a63bf9d32020d07eeb4707d", provider); // ใช้ private key ที่คุณมี
const lotteryContract = new ethers.Contract(contractAddress, lotteryABI, wallet);
async function autoGenerateLottery() {
    try {
      const tx = await lotteryContract.generateLottery(10,10);
      await tx.wait();
      console.log("Lottery round generated successfully!");
    } catch (error) {
      console.error("Error generating lottery:", error);
    }
  }

  async function Prizedraw() {
    try {
      const winNumber = await lotteryContract.drawWinners(lotteryContract.getLatestRoundId());
      await winNumber.wait();
      console.log("ออกรางวัลสำเร็จ!");
    } catch (error) {
      console.error("Error generating lottery:", error);
    }
  }

  async function startLottery() {
    let round = await lotteryContract.getLatestRoundId();
  
    if (round.toString() === "0") {
      console.log("ยังไม่มีรอบหวย กำลังสร้างรอบแรก...");
      await autoGenerateLottery();
      round = await lotteryContract.getLatestRoundId(); // อัปเดตรอบใหม่หลังจากสร้าง
    }
  
    cron.schedule("*/10 * * * *", async () => {
      try {
        round = await lotteryContract.getLatestRoundId(); // ดึงรอบล่าสุดก่อนออกรางวัล
        console.log("กำลังออกรางวัล... งวดที่", round.toString());
  
        await Prizedraw();
        const winNumber = await lotteryContract.getWinningNumbers(round.toString());
        console.log("เลขรางวัล:", winNumber.toString());
  
        console.log("กำลังสร้างรอบหวยใหม่...");
        await autoGenerateLottery();
      } catch (error) {
        console.error("Error in cron job:", error);
      }
    });
  
    console.log("Cron job started, running every minute...");
  }
  
  startLottery();


  app.get("/api/winning-numbers", async (req, res) => {
    try {
      // ดึงรอบล่าสุดจาก contract
      const latestRoundId = await lotteryContract.getLatestRoundId();
  
      // ตรวจสอบว่า latestRoundId เป็น 0 หรือไม่ เพื่อหลีกเลี่ยงข้อผิดพลาด
      if (latestRoundId.toString() === "0") {
        return res.status(400).json({ error: "ยังไม่มีรอบหวย" });
      }
  
      // ดึงเลขรางวัลจากรอบที่แล้ว (previous round)
      const previousRoundId = (BigInt(latestRoundId) - 1n).toString(); // ลดค่าของ roundId ลง 1
      const winningNumbers = await lotteryContract.getWinningNumbers(previousRoundId);
  
      // ส่งข้อมูลเลขรางวัลกลับไป
      res.json({
        roundId: previousRoundId,
        winningNumbers: winningNumbers.map(num => num.toString()), // แปลงค่าเป็นสตริงเพื่อให้ส่งกลับได้
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });
  


// ดึงเลขหวยของงวดที่กำหนด
app.get("/api/tickets/:roundId", async (req, res) => {
  try {
    const { roundId } = req.params;
    
    const result = await lotteryContract.getTicketsByRound(roundId);

    const singleTickets = result[0].map(ticket => ticket.toString());
    const singleTicketStatus = result[1]; // เป็น boolean[]
    const pairTickets = result[2].map(ticket => ticket.toString());
    const pairTicketStatus = result[3]; // เป็น boolean[]

    res.json({ roundId, singleTickets, singleTicketStatus, pairTickets, pairTicketStatus });
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

app.get("/api/user-tickets/:userAddress", async (req, res) => {
    try {
      const { userAddress } = req.params;
      const userTickets = await lotteryContract.getAllUserTickets(userAddress);
      console.log("userTickets: ", userTickets)
      // Convert BigInts to strings
      const formattedTickets = userTickets.map((entry) => ({
        roundId: entry.roundId.toString(),
        tickets: entry.tickets.map((ticket) => ticket.toString()),
      }));
      console.log("formattedTickets: ",formattedTickets)
  
      res.json({ userAddress, tickets: formattedTickets });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

app.post("/api/buy-tickets", async (req, res) => {
    try {
      let { userAddress, roundId, ticketNumbers } = req.body;
      console.log(userAddress, roundId, ticketNumbers);
      console.log("ticketNumbers type:", typeof ticketNumbers);
      console.log("ticketNumbers value:", ticketNumbers);
  
      if (!userAddress || !roundId || !ticketNumbers) {
        return res.status(400).json({ error: "Invalid input data" });
      }
  
      // Ensure userAddress is a string (Ethereum address)
      userAddress = String(userAddress).toLowerCase();
      if (!/^0x[a-fA-F0-9]{40}$/.test(userAddress)) {
        return res.status(400).json({ error: "Invalid Ethereum address" });
      }
  
      // Convert roundId to a number
      roundId = Number(roundId);
      if (isNaN(roundId)) {
        return res.status(400).json({ error: "Invalid roundId" });
      }
  
      // Ensure ticketNumbers is an array of integers (uint256[])
      if (typeof ticketNumbers === 'string') {
        // If ticketNumbers is a string, convert it to an array with a single number
        ticketNumbers = [parseInt(ticketNumbers, 10)];
      } else if (Array.isArray(ticketNumbers)) {
        // If ticketNumbers is an array, parse each value to an integer
        ticketNumbers = ticketNumbers.map(num => {
          const parsedNum = parseInt(num, 10);
          if (isNaN(parsedNum) || parsedNum < 0 || !Number.isInteger(parsedNum)) {
            throw new Error(`Invalid ticket number: ${num}`);
          }
          return parsedNum;
        });
      } else {
        return res.status(400).json({ error: "Invalid ticketNumbers format" });
      }
  
      console.log("ticketNumbers type after conversion:", typeof ticketNumbers);
      console.log("userAddress:", userAddress);
      console.log("roundId:", roundId);
  
      // Call the smart contract function
      const tx = await lotteryContract.buyTickets(userAddress, roundId, ticketNumbers);
      await tx.wait();
  
      res.json({ message: "Tickets purchased successfully", roundId, ticketNumbers });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

// เปิด Server
const PORT = 5000;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
