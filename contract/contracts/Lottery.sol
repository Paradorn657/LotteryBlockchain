// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract Lottery {
    address public owner;
    uint256 public roundId;
    uint256 public maxTicketsPerRound = 1000;

     struct Ticket {
        uint256 ticketId;
        uint256 number;
    }
    struct UserTickets {
        uint256 roundId;
        uint256[] ticketNumbers;
    }
    
    struct Round {
        uint256 totalEntries; // จำนวน entry ทั้งหมด = จำนวนหวยเดี่ยว + จำนวนหวยชุด
        uint256[] singleTickets;  // เก็บเลขหวยเดี่ยว (แต่ละใบเป็น entry หนึ่ง)
        uint256[] pairTickets;    // เก็บเลขหวยชุด (แต่ละชุดเก็บ entry เดียว)
        bool isDrawn;
        uint256[3] winningNumbers;
    }
    // Mapping to store the user's ticket numbers per round
    mapping(address => mapping(uint256 => uint256[])) public userTickets;
    mapping(uint256 => Ticket) public tickets;

    mapping(uint256 => Round) public rounds;
    // Mapping สำหรับติดตามเลขที่ถูกซื้อในแต่ละงวด
    mapping(uint256 => mapping(uint256 => bool)) public purchasedTickets;


    event LotteryGenerated(uint256 roundId, uint256 totalEntries);
    event TicketBought(address indexed user, uint256 roundId, uint256 ticketNumber);
    event LotteryDrawn(uint256 roundId, uint256 firstPrize, uint256 secondPrize, uint256 thirdPrize);
    
    modifier onlyOwner() {
        require(msg.sender == owner, "Only owner can call this");
        _;
    }

    constructor() {
        owner = msg.sender;
        roundId = 0;
    }

    /**
     * @notice สร้างหวยในแต่ละงวด โดยรวมทั้งหวยเดี่ยวและหวยชุดเข้าด้วยกัน
     * @param _singleTicketCount จำนวนหวยเดี่ยว (แต่ละใบเป็น entry หนึ่ง)
     * @param _pairCount จำนวนชุดหวย (ชุดละ 1 entry; ในชุดนั้นจะมีเลขเดียวกัน 2 ใบ)
     */
    function generateLottery(uint256 _singleTicketCount, uint256 _pairCount) external onlyOwner {
        uint256 totalEntries = _singleTicketCount + _pairCount;
        require(totalEntries > 0 && totalEntries <= maxTicketsPerRound, "Invalid total ticket count");
        
        roundId++;
        rounds[roundId].totalEntries = totalEntries;
        
        // สร้างหวยเดี่ยว
        for (uint256 i = 0; i < _singleTicketCount; i++) {
            uint256 ticketNumber = uint256(keccak256(abi.encodePacked(block.timestamp, msg.sender, i))) % 999999 + 1;
            if (ticketNumber < 100000) {
            ticketNumber = ticketNumber + 100000; // เติม 100000 เพื่อให้เป็นเลข 6 หลักเสมอ
            }
            purchasedTickets[roundId][ticketNumber] = false;
            rounds[roundId].singleTickets.push(ticketNumber);
        }
        
        // สร้างหวยชุด (เก็บ entry เดียวสำหรับแต่ละชุด)
        for (uint256 i = 0; i < _pairCount; i++) {
            uint256 ticketNumber = uint256(keccak256(abi.encodePacked(block.timestamp, msg.sender, _singleTicketCount + i))) % 999999 + 1;
            if (ticketNumber < 100000) {
            ticketNumber = ticketNumber + 100000; // เติม 100000 เพื่อให้เป็นเลข 6 หลักเสมอ
            }
            purchasedTickets[roundId][ticketNumber] = false;
            rounds[roundId].pairTickets.push(ticketNumber);
        }
        
        emit LotteryGenerated(roundId, totalEntries);
    }

    function buyTickets(address _user, uint256 _roundId, uint256[] calldata _ticketNumbers) external returns (uint256[] memory) {
        // ตรวจสอบว่ารอบนี้มีอยู่จริงและยังไม่ได้จับรางวัล
        require(rounds[_roundId].totalEntries > 0, "Round does not exist");
        require(!rounds[_roundId].isDrawn, "This round has already been drawn");
        
        
        for (uint256 i = 0; i < _ticketNumbers.length; i++) {
            uint256 ticketNumber = _ticketNumbers[i];
            
            // ตรวจสอบว่าเลขนี้มีในรอบนี้และยังไม่ถูกซื้อ
            bool ticketExists = false;
            
            // ตรวจสอบในหวยเดี่ยว
            for (uint256 j = 0; j < rounds[_roundId].singleTickets.length; j++) {
                if (rounds[_roundId].singleTickets[j] == ticketNumber) {
                    ticketExists = true;
                    break;
                }
            }
            
            // ตรวจสอบในหวยชุด
            if (!ticketExists) {
                for (uint256 j = 0; j < rounds[_roundId].pairTickets.length; j++) {
                    if (rounds[_roundId].pairTickets[j] == ticketNumber) {
                        ticketExists = true;
                        break;
                    }
                }
            }
            
            require(ticketExists, "Ticket number not available in this round");
            require(!purchasedTickets[_roundId][ticketNumber], "Ticket already purchased");
            
            // เปลี่ยนสถานะเลขหวย
            purchasedTickets[_roundId][ticketNumber] = true;
            
            // เพิ่มเลขหวยในรายการของผู้ใช้
            userTickets[_user][_roundId].push(ticketNumber);
            
            // ส่ง event
            emit TicketBought(_user, _roundId, ticketNumber);
        }
        
        return userTickets[_user][_roundId];
    }

    function getAllUserTickets(address _user) external view returns (UserTickets[] memory) {
        uint256 totalRounds = roundId; // จำนวนรอบทั้งหมด
        
        // นับจำนวนรอบที่ผู้ใช้มีการซื้อหวย
        uint256 validRounds = 0;
        for (uint256 i = 1; i <= totalRounds; i++) {
            if (userTickets[_user][i].length > 0) {
                validRounds++;
            }
        }
        
        // สร้าง array ที่มีขนาดพอดีกับจำนวนรอบที่มีการซื้อหวย
        UserTickets[] memory userTicketsArray = new UserTickets[](validRounds);
        
        uint256 index = 0;
        
        // รวบรวมข้อมูลการซื้อหวยในแต่ละรอบ
        for (uint256 i = 1; i <= totalRounds; i++) {
            uint256[] memory ticketsInRound = userTickets[_user][i];
            if (ticketsInRound.length > 0) {
                userTicketsArray[index] = UserTickets(i, ticketsInRound);
                index++;
            }
        }
        
        return userTicketsArray;
    }


    /**
     * @notice ดึงรายการ entry ทั้งหมด (หวยเดี่ยวและหวยชุด) เพื่อใช้สุ่มผู้ชนะ
     */
    function _getCombinedEntries(uint256 _roundId) internal view returns (uint256[] memory) {
        uint256 total = rounds[_roundId].singleTickets.length + rounds[_roundId].pairTickets.length;
        uint256[] memory entries = new uint256[](total);
        uint256 index = 0;
        
        for (uint256 i = 0; i < rounds[_roundId].singleTickets.length; i++) {
            entries[index] = rounds[_roundId].singleTickets[i];
            index++;
        }
        for (uint256 i = 0; i < rounds[_roundId].pairTickets.length; i++) {
            entries[index] = rounds[_roundId].pairTickets[i];
            index++;
        }
        return entries;
    }
    
    /**
     * @notice สุ่มประกาศรางวัล 3 รางวัล โดยใช้ entry ที่รวมหวยเดี่ยวและหวยชุดแล้ว
     */
    function drawWinners(uint256 _roundId) external onlyOwner {
        require(rounds[_roundId].totalEntries > 0, "Round does not exist");
        require(!rounds[_roundId].isDrawn, "Winners already drawn");

        uint256[] memory entries = _getCombinedEntries(_roundId);
        require(entries.length >= 3, "Not enough entries to draw");

        uint256[3] memory winningNumbers;
        uint256 randomIndex;
        
        // 1st Prize
        randomIndex = uint256(keccak256(abi.encodePacked(block.timestamp, msg.sender, uint256(0)))) % entries.length;
        winningNumbers[0] = entries[randomIndex];

        // 2nd Prize (ensure different from 1st)
        do {
            randomIndex = uint256(keccak256(abi.encodePacked(block.timestamp, msg.sender, uint256(1)))) % entries.length;
        } while (winningNumbers[0] == entries[randomIndex]);
        winningNumbers[1] = entries[randomIndex];

        // 3rd Prize (ensure different from 1st and 2nd)
        do {
            randomIndex = uint256(keccak256(abi.encodePacked(block.timestamp, msg.sender, uint256(2)))) % entries.length;
        } while (winningNumbers[0] == entries[randomIndex] || winningNumbers[1] == entries[randomIndex]);
        winningNumbers[2] = entries[randomIndex];

        rounds[_roundId].winningNumbers = winningNumbers;
        rounds[_roundId].isDrawn = true;

        emit LotteryDrawn(_roundId, winningNumbers[0], winningNumbers[1], winningNumbers[2]);
    }
    
    // ฟังก์ชันอ่านข้อมูลหวยเดี่ยวและหวยชุดแยกกัน
    function getTicketsByRound(uint256 _roundId) external view returns (
        uint256[] memory singleTickets, bool[] memory singleTicketStatus,
        uint256[] memory pairTickets, bool[] memory pairTicketStatus
    ) {
        Round storage roundData = rounds[_roundId];
        singleTickets = roundData.singleTickets;
        pairTickets = roundData.pairTickets;
        
        uint256 singleCount = singleTickets.length;
        singleTicketStatus = new bool[](singleCount);
        for (uint256 i = 0; i < singleCount; i++){
            singleTicketStatus[i] = purchasedTickets[_roundId][singleTickets[i]];
        }
        
        uint256 pairCount = pairTickets.length;
        pairTicketStatus = new bool[](pairCount);
        for (uint256 i = 0; i < pairCount; i++){
            pairTicketStatus[i] = purchasedTickets[_roundId][pairTickets[i]];
        }
    }
    
    function getWinningNumbers(uint256 _roundId) external view returns (uint256[3] memory) {
        require(rounds[_roundId].isDrawn, "Winners not drawn yet");
        return rounds[_roundId].winningNumbers;
    }
    
    function getLatestRoundId() external view returns (uint256) {
        return roundId;
    }
}
