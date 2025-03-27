const express = require("express");
const { ethers } = require("ethers");
require('dotenv').config()
const cron = require("node-cron");
const cors = require("cors");


const app = express();
app.use(cors()); // เพื่อให้ Next.js เรียก API ได้
app.use(express.json());

const provider = new ethers.JsonRpcProvider(process.env.PROVIDER_URL); // ใช้ Ganache หรือ Hardhat
const contractAddress = process.env.CONTRACT_ADDRESS; // ใส่ address ที่ deploy แล้ว
const lotteryABI = require("../contract/artifacts/contracts/Lottery.sol/Lottery.json").abi;
//ใช้ private key เพื่อสร้าง wallet เอาไว้บอกเจ้าของ
const wallet = new ethers.Wallet(process.env.OWNER_PRIVATE_KEY, provider); // ใช้ private key ที่คุณมี
const lotteryContract = new ethers.Contract(contractAddress, lotteryABI, wallet);
async function autoGenerateLottery() {
    try {
      const tx = await lotteryContract.generateLottery(10,10 ,{ gasLimit: 5000000 });
      await tx.wait();
      console.log("Lottery round generated successfully!");
    } catch (error) {
      console.error("Error generating lottery:", error);
    }
  }

  async function Prizedraw() {
    try {
      const winNumber = await lotteryContract.drawWinners(lotteryContract.getLatestRoundId(),{ gasLimit: 5000000 });
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
  
    cron.schedule("*/1 * * * *", async () => {
      try {
        round = await lotteryContract.getLatestRoundId(); // ดึงรอบล่าสุดก่อนออกรางวัล
        console.log("กำลังออกรางวัล... งวดที่", round.toString());
  
        await Prizedraw();
        const winNumber = await lotteryContract.getWinningNumbers(round.toString());
        console.log("เลขรางวัล:", winNumber.toString());
  
        console.log("กำลังสร้างรอบหวยใหม่...");
        await autoGenerateLottery();

        // Get round results
        const roundResults = await lotteryContract.printRoundResults(round-1);
        const winners = extractWinners(roundResults);

        let transactions = [];
        if (Object.keys(winners).length > 0) {
            transactions = await sendPrize(winners);
        }


      } catch (error) {
        console.error("Error in cron job:", error);
      }
    });
  
    console.log("Cron job started, running every minute...");
  }
  
  startLottery();


  app.get("/api/winning-numbers", async (req, res) => {
    try {
      // ดึง roundId จาก query string (ถ้าไม่มีให้ใช้ default เป็น previous round)
      let { roundId } = req.query;
      
      // ดึงรอบล่าสุดจาก contract
      const latestRoundId = await lotteryContract.getLatestRoundId();
      if (latestRoundId.toString() === "0") {
        return res.status(400).json({ error: "ยังไม่มีรอบหวย" });
      }
      
      // ถ้าไม่ได้ส่ง roundId เข้ามา ให้ใช้ previous round (latestRoundId - 1)
      if (!roundId) {
        roundId = (BigInt(latestRoundId) - 1n).toString();
      }
      
      // ดึงเลขรางวัลจากรอบที่เลือก
      const winningNumbers = await lotteryContract.getWinningNumbers(roundId);
      
      // ดึงวันที่ที่สร้าง round นั้น (timestamp)
      const createdDate = await lotteryContract.getDateRoundbyId(roundId);
    
      // ส่งข้อมูลกลับ
      res.json({
        roundId: roundId,
        winningNumbers: winningNumbers.map(num => num.toString()),
        createdDate: createdDate.toString() // timestamp ที่ได้จาก smart contract (Unix timestamp)
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
    const createdDate = await lotteryContract.getDateRoundbyId(Number(roundId));

    // console.log("createdDate: ", createdDate);

    const singleTickets = result[0].map(ticket => ticket.toString());
    const singleTicketStatus = result[1]; // เป็น boolean[]
    const pairTickets = result[2].map(ticket => ticket.toString());
    const pairTicketStatus = result[3]; // เป็น boolean[]

    res.json({ roundId, singleTickets, singleTicketStatus, pairTickets, pairTicketStatus,createdDate:createdDate.toString() });
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
      
      console.log("userTickets ที่ดึงจาก blockchain:", userTickets);
      const formattedTickets = userTickets.map((entry) => ({
        roundId: entry[0].toString(),  // Extract roundId
        single: entry[1].map((ticket) => ticket.toString()),  // Extract and convert tickets
        pair:entry[2].map((ticket) => ticket.toString()),
      }));
      console.log("useraddress:", userAddress);
      const lastIndex = formattedTickets.length - 1;
      console.log("formattedTickets:", formattedTickets[lastIndex]);
      console.log("หวยเดี่ยว:", formattedTickets[lastIndex].single);
      console.log("หวยคู่:", formattedTickets[lastIndex].pair);
  
      res.json({ userAddress, tickets: formattedTickets });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  const PRIZES = {
    "FIRST PRIZE": ethers.parseEther("10"), // 10 ETH
    "SECOND PRIZE": ethers.parseEther("5"),  // 5 ETH
    "THIRD PRIZE": ethers.parseEther("1")   // 1 ETH
};

// Function to extract winners and their prize amounts
function extractWinners(resultsString) {
    const users = resultsString.split("\n\nUser ");
    const winningNumbersMatch = resultsString.match(/Winning Numbers: ([\d, ]+)/);

    if (!winningNumbersMatch) return [];
    
    const winningNumbers = new Set(winningNumbersMatch[1].split(", ").map(Number));
    const winners = {};

    for (const user of users) {
        const addressMatch = user.match(/(0x[a-fA-F0-9]{40})/);
        if (!addressMatch) continue;

        const address = addressMatch[1];
        let totalPrize = ethers.parseEther("0");
        let lines = user.split("\n");

        for (const line of lines) {
            const ticketMatch = line.match(/Ticket (\d+)/);
            const prizeMatch = line.match(/- (.+)$/);
            const isPairTicket = line.includes("(Pair Ticket)");

            if (ticketMatch && prizeMatch) {
                const ticketNumber = parseInt(ticketMatch[1], 10);
                const prizeType = prizeMatch[1];

                if (winningNumbers.has(ticketNumber) && PRIZES[prizeType]) {
                    let prizeAmount = PRIZES[prizeType];

                    if (isPairTicket) {
                        prizeAmount = prizeAmount * BigInt(2); // Double the prize for Pair Tickets
                    }

                    totalPrize += prizeAmount;
                }
            }
        }

        if (totalPrize > 0) {
            winners[address] = (winners[address] || ethers.parseEther("0")) + totalPrize;
        }
    }

    return winners;
}

// Function to send Ether to winners
async function sendPrize(winners) {
    let transactions = [];

    for (const [address, prizeAmount] of Object.entries(winners)) {
        try {
            const tx = await wallet.sendTransaction({
                to: address,
                value: prizeAmount,
                gasLimit: 21000
            });

            console.log(`✅ Sent ${ethers.formatEther(prizeAmount)} ETH to ${address}: ${tx.hash}`);
            transactions.push({ address, txHash: tx.hash, amount: ethers.formatEther(prizeAmount) });
        } catch (error) {
            console.error(`❌ Failed to send to ${address}: ${error.message}`);
        }
    }

    return transactions;
}

// API route to get winners & transfer money
app.get("/api/get-winner", async (req, res) => {
    try {
        let { roundId } = req.query;

        // Get round results
        const roundResults = await lotteryContract.printRoundResults(roundId);
        const winners = extractWinners(roundResults);

        let transactions = [];
        if (Object.keys(winners).length > 0) {
            transactions = await sendPrize(winners);
        }

        res.json({ 
            message: "Round results retrieved successfully",
            results: roundResults,
            winners,
            transactions
        });
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
  
  
      console.log("userAddress:", userAddress);
      console.log("roundId:", roundId);
      console.log("ticketNumbers:", [ticketNumbers]);
  
      // Call the smart contract function
      const tx = await lotteryContract.buyTickets(userAddress, roundId, [ticketNumbers]);
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
