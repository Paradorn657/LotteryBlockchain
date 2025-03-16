// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract Lottery {
    address public owner;
    uint256 public roundId; // เลขงวดล่าสุด
    uint256 public maxTicketsPerRound = 1000; // จำนวนหวยต่อรอบ (ตั้งค่าได้)
    
    struct Ticket {
        uint256 ticketId;
        uint256 number;
    }

    struct Round {
        uint256 totalTickets;
        uint256[] ticketNumbers;
        bool isDrawn;
    }

    mapping(uint256 => Round) public rounds; // เก็บข้อมูลหวยแต่ละงวด

    event LotteryGenerated(uint256 roundId, uint256 totalTickets);
    
    modifier onlyOwner() {
        require(msg.sender == owner, "Only owner can call this");
        _;
    }

    constructor() {
        owner = msg.sender;
        roundId = 0;
    }

    function generateLottery(uint256 _ticketCount) external onlyOwner {
        require(_ticketCount > 0 && _ticketCount <= maxTicketsPerRound, "Invalid ticket count");
        roundId++; // เริ่มงวดใหม่
        rounds[roundId].totalTickets = _ticketCount;

        for (uint256 i = 0; i < _ticketCount; i++) {
            uint256 ticketNumber = uint256(keccak256(abi.encodePacked(block.timestamp, msg.sender, i))) % 999999 + 1;
            rounds[roundId].ticketNumbers.push(ticketNumber);
        }

        emit LotteryGenerated(roundId, _ticketCount);
    }

    function getTicketsByRound(uint256 _roundId) external view returns (uint256[] memory) {
        return rounds[_roundId].ticketNumbers;
    }

    function getLatestRoundId() external view returns (uint256) {
        return roundId;
    }
}
