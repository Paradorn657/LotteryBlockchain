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
        uint256[] singleTickets;
        uint256[] pairTickets;
    }
    struct UserWinning {
        uint256 roundId;
        uint256 ticketNumber;
        uint256 prizeRank; // 0 = First Prize, 1 = Second Prize, 2 = Third Prize
    }

    struct ClaimResult {
        address user;
        uint256 roundId;
        uint256 ticketNumber;
        string ticketType;
        uint256 prizeRank; // 0 = First Prize, 1 = Second Prize, 2 = Third Prize
    }
    mapping(address => UserWinning[]) public userWinnings;
    event UserWon(
        address indexed user,
        uint256 roundId,
        uint256 ticketNumber,
        uint256 prizeRank
    );

    struct Round {
        uint256 totalEntries; // จำนวน entry ทั้งหมด = จำนวนหวยเดี่ยว + จำนวนหวยชุด
        uint256[] singleTickets; // เก็บเลขหวยเดี่ยว (แต่ละใบเป็น entry หนึ่ง)
        uint256[] pairTickets; // เก็บเลขหวยชุด (แต่ละชุดเก็บ entry เดียว)
        bool isDrawn;
        uint256[3] winningNumbers;
        uint256 createdDate; // เพิ่มตัวแปรเก็บวันที่สร้าง round (block.timestamp)
    }
    // Mapping to store the user's ticket numbers per round
    mapping(address => mapping(uint256 => uint256[])) public userTickets;
    mapping(uint256 => Ticket) public tickets;
    mapping(uint256 => Round) public rounds;
    // Mapping สำหรับติดตามเลขที่ถูกซื้อในแต่ละงวด
    mapping(uint256 => mapping(uint256 => bool)) public purchasedTickets;

    mapping(uint256 => address[]) public roundUsers; // Track users per round
    mapping(uint256 => mapping(address => bool)) public userInRound; // Quick lookup if user is in round

    event LotteryGenerated(uint256 roundId, uint256 totalEntries);
    event TicketBought(
        address indexed user,
        uint256 roundId,
        uint256 ticketNumber
    );
    event LotteryDrawn(
        uint256 roundId,
        uint256 firstPrize,
        uint256 secondPrize,
        uint256 thirdPrize
    );

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
    function generateLottery(
        uint256 _singleTicketCount,
        uint256 _pairCount
    ) external onlyOwner {
        uint256 totalEntries = _singleTicketCount + _pairCount;
        require(
            totalEntries > 0 && totalEntries <= maxTicketsPerRound,
            "Invalid total ticket count"
        );

        roundId++;
        rounds[roundId].totalEntries = totalEntries;
        rounds[roundId].createdDate = block.timestamp; // บันทึกวันที่สร้าง round

        // สร้างหวยเดี่ยว
        for (uint256 i = 0; i < _singleTicketCount; i++) {
            uint256 ticketNumber = (uint256(
                keccak256(abi.encodePacked(block.timestamp, msg.sender, i))
            ) % 999999) + 1;
            if (ticketNumber < 100000) {
                ticketNumber = ticketNumber + 100000; // เติม 100000 เพื่อให้เป็นเลข 6 หลักเสมอ
            }
            purchasedTickets[roundId][ticketNumber] = false;
            rounds[roundId].singleTickets.push(ticketNumber);
        }

        // สร้างหวยชุด (เก็บ entry เดียวสำหรับแต่ละชุด)
        for (uint256 i = 0; i < _pairCount; i++) {
            uint256 ticketNumber = (uint256(
                keccak256(
                    abi.encodePacked(
                        block.timestamp,
                        msg.sender,
                        _singleTicketCount + i
                    )
                )
            ) % 999999) + 1;
            if (ticketNumber < 100000) {
                ticketNumber = ticketNumber + 100000; // เติม 100000 เพื่อให้เป็นเลข 6 หลักเสมอ
            }
            purchasedTickets[roundId][ticketNumber] = false;
            rounds[roundId].pairTickets.push(ticketNumber);
        }

        emit LotteryGenerated(roundId, totalEntries);
    }

    function buyTickets(
        address _user,
        uint256 _roundId,
        uint256[] calldata _ticketNumbers
    ) external returns (uint256[] memory) {
        require(rounds[_roundId].totalEntries > 0, "Round does not exist");
        require(!rounds[_roundId].isDrawn, "This round has already been drawn");

        // Track if this is the first ticket for this user in this round
        bool isFirstTicketForUser = userTickets[_user][_roundId].length == 0;

        for (uint256 i = 0; i < _ticketNumbers.length; i++) {
            uint256 ticketNumber = _ticketNumbers[i];
            bool ticketExists = false;

            // Check single tickets
            for (
                uint256 j = 0;
                j < rounds[_roundId].singleTickets.length;
                j++
            ) {
                if (rounds[_roundId].singleTickets[j] == ticketNumber) {
                    ticketExists = true;
                    break;
                }
            }

            // Check pair tickets if not found in single tickets
            if (!ticketExists) {
                for (
                    uint256 j = 0;
                    j < rounds[_roundId].pairTickets.length;
                    j++
                ) {
                    if (rounds[_roundId].pairTickets[j] == ticketNumber) {
                        ticketExists = true;
                        break;
                    }
                }
            }

            require(ticketExists, "Ticket number not available in this round");
            require(
                !purchasedTickets[_roundId][ticketNumber],
                "Ticket already purchased"
            );

            purchasedTickets[_roundId][ticketNumber] = true;
            userTickets[_user][_roundId].push(ticketNumber);

            emit TicketBought(_user, _roundId, ticketNumber);
        }

        // If this is the first ticket for the user in this round, add to roundUsers
        if (isFirstTicketForUser) {
            if (!userInRound[_roundId][_user]) {
                roundUsers[_roundId].push(_user);
                userInRound[_roundId][_user] = true;
            }
        }

        return userTickets[_user][_roundId];
    }

    function getUsersInRound(
        uint256 _roundId
    ) external view returns (address[] memory) {
        return roundUsers[_roundId];
    }

    // New function to check if a user is in a specific round
    function isUserInRound(
        uint256 _roundId,
        address _user
    ) external view returns (bool) {
        return userInRound[_roundId][_user];
    }

    function getAllUserTickets(
        address _user
    ) external view returns (UserTickets[] memory) {
        uint256 totalRounds = roundId;
        uint256 validRounds = 0;

        // นับจำนวนรอบที่ user มีหวย
        for (uint256 i = 1; i <= totalRounds; i++) {
            if (userTickets[_user][i].length > 0) {
                validRounds++;
            }
        }

        // เตรียมโครงสร้างคืนค่า
        UserTickets[] memory userTicketsArray = new UserTickets[](validRounds);
        uint256 index = 0;

        for (uint256 i = 1; i <= totalRounds; i++) {
            uint256[] memory ticketsInRound = userTickets[_user][i];
            if (ticketsInRound.length > 0) {
                uint256[] memory singleTickets;
                uint256[] memory pairTickets;
                uint256 singleCount = 0;
                uint256 pairCount = 0;

                // ตรวจสอบแต่ละเลขว่าเป็นหวยเดี่ยวหรือหวยชุด
                for (uint256 j = 0; j < ticketsInRound.length; j++) {
                    uint256 ticketNumber = ticketsInRound[j];

                    bool isPair = false;
                    for (uint256 k = 0; k < rounds[i].pairTickets.length; k++) {
                        if (rounds[i].pairTickets[k] == ticketNumber) {
                            isPair = true;
                            break;
                        }
                    }

                    if (isPair) {
                        pairCount++;
                    } else {
                        singleCount++;
                    }
                }

                // จัดสรร array ตามจำนวนที่นับได้
                singleTickets = new uint256[](singleCount);
                pairTickets = new uint256[](pairCount);

                uint256 singleIndex = 0;
                uint256 pairIndex = 0;

                for (uint256 j = 0; j < ticketsInRound.length; j++) {
                    uint256 ticketNumber = ticketsInRound[j];

                    bool isPair = false;
                    for (uint256 k = 0; k < rounds[i].pairTickets.length; k++) {
                        if (rounds[i].pairTickets[k] == ticketNumber) {
                            isPair = true;
                            break;
                        }
                    }

                    if (isPair) {
                        pairTickets[pairIndex] = ticketNumber;
                        pairIndex++;
                    } else {
                        singleTickets[singleIndex] = ticketNumber;
                        singleIndex++;
                    }
                }

                // ใส่ข้อมูลลงใน struct ที่ return ออกไป
                userTicketsArray[index] = UserTickets(
                    i,
                    singleTickets,
                    pairTickets
                );
                index++;
            }
        }

        return userTicketsArray;
    }

    function _getCombinedEntries(
        uint256 _roundId
    ) internal view returns (uint256[] memory) {
        uint256 total = rounds[_roundId].singleTickets.length +
            rounds[_roundId].pairTickets.length;
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

    function drawWinners(
        uint256 _roundId
    )
        external
        onlyOwner
        returns (uint256 roundDrawn, uint256[3] memory winningNumbers)
    {
        require(rounds[_roundId].totalEntries > 0, "Round does not exist");
        require(!rounds[_roundId].isDrawn, "Winners already drawn");

        uint256[] memory entries = _getCombinedEntries(_roundId);
        require(entries.length >= 3, "Not enough entries to draw");

        uint256[3] memory generatedWinningNumbers;
        uint256 randomIndex;

        // 1st Prize
        randomIndex =
            uint256(
                keccak256(
                    abi.encodePacked(block.timestamp, msg.sender, uint256(0))
                )
            ) %
            entries.length;
        generatedWinningNumbers[0] = entries[randomIndex];

        // 2nd Prize (ensure different from 1st)
        do {
            randomIndex =
                uint256(
                    keccak256(
                        abi.encodePacked(
                            block.timestamp,
                            msg.sender,
                            uint256(1)
                        )
                    )
                ) %
                entries.length;
        } while (generatedWinningNumbers[0] == entries[randomIndex]);
        generatedWinningNumbers[1] = entries[randomIndex];

        // 3rd Prize (ensure different from 1st and 2nd)
        do {
            randomIndex =
                uint256(
                    keccak256(
                        abi.encodePacked(
                            block.timestamp,
                            msg.sender,
                            uint256(2)
                        )
                    )
                ) %
                entries.length;
        } while (
            generatedWinningNumbers[0] == entries[randomIndex] ||
                generatedWinningNumbers[1] == entries[randomIndex]
        );
        generatedWinningNumbers[2] = entries[randomIndex];

        rounds[_roundId].winningNumbers = generatedWinningNumbers;
        rounds[_roundId].isDrawn = true;

        emit LotteryDrawn(
            _roundId,
            generatedWinningNumbers[0],
            generatedWinningNumbers[1],
            generatedWinningNumbers[2]
        );

        return (_roundId, generatedWinningNumbers);
    }

    function isInArray(
        uint256[] memory arr,
        uint256 value
    ) internal pure returns (bool) {
        for (uint256 i = 0; i < arr.length; i++) {
            if (arr[i] == value) {
                return true;
            }
        }
        return false;
    }

    function getTicketsByRound(
        uint256 _roundId
    )
        external
        view
        returns (
            uint256[] memory singleTickets,
            bool[] memory singleTicketStatus,
            uint256[] memory pairTickets,
            bool[] memory pairTicketStatus
        )
    {
        Round storage roundData = rounds[_roundId];
        singleTickets = roundData.singleTickets;
        pairTickets = roundData.pairTickets;

        uint256 singleCount = singleTickets.length;
        singleTicketStatus = new bool[](singleCount);
        for (uint256 i = 0; i < singleCount; i++) {
            singleTicketStatus[i] = purchasedTickets[_roundId][
                singleTickets[i]
            ];
        }

        uint256 pairCount = pairTickets.length;
        pairTicketStatus = new bool[](pairCount);
        for (uint256 i = 0; i < pairCount; i++) {
            pairTicketStatus[i] = purchasedTickets[_roundId][pairTickets[i]];
        }
    }

    function getWinningNumbers(
        uint256 _roundId
    ) external view returns (uint256[3] memory) {
        require(rounds[_roundId].isDrawn, "Winners not drawn yet");
        return rounds[_roundId].winningNumbers;
    }

    function getLatestRoundId() external view returns (uint256) {
        return roundId;
    }

    // ฟังก์ชัน getDateRoundbyId() คืนค่า timestamp ของวันที่สร้าง round นั้น
    function getDateRoundbyId(
        uint256 _roundId
    ) external view returns (uint256) {
        require(rounds[_roundId].totalEntries > 0, "Round does not exist");
        return rounds[_roundId].createdDate;
    }
    function getUserForTickets(
        uint256 _roundId
    ) internal view returns (address) {
        // Placeholder implementation - replace with actual logic to find a user who bought tickets in a round
        // This might require additional tracking in your buyTickets function
        for (
            address user = address(1);
            user < address(type(uint160).max);
            user = address(uint160(uint256(uint160(user)) + 1))
        ) {
            if (userTickets[user][_roundId].length > 0) {
                return user;
            }
        }
        return address(0);
    }

    // Helper function to check prize status
    function _checkPrizeStatus(
        uint256 _roundId,
        uint256 _ticketNumber,
        uint256[3] memory _winningNumbers
    ) internal pure returns (string memory) {
        if (_ticketNumber == _winningNumbers[0]) {
            return "FIRST PRIZE";
        } else if (_ticketNumber == _winningNumbers[1]) {
            return "SECOND PRIZE";
        } else if (_ticketNumber == _winningNumbers[2]) {
            return "THIRD PRIZE";
        }

        return "No Prize";
    }

    function getUserForTicket(
        uint256 _roundId,
        uint256 _ticketNumber
    ) internal view returns (address) {
        address winner = address(0);

        // Loop through users and check if they have the winning ticket number
        address[] memory usersInRound = roundUsers[_roundId];
        for (uint256 i = 0; i < usersInRound.length; i++) {
            address currentUser = usersInRound[i];
            uint256[] memory userTicketsInRound = userTickets[currentUser][
                _roundId
            ];

            // Check if the user has the winning ticket number
            for (uint256 j = 0; j < userTicketsInRound.length; j++) {
                if (userTicketsInRound[j] == _ticketNumber) {
                    winner = currentUser;
                    break;
                }
            }
        }
        return winner;
    }

    function getWinningResults() external view returns (ClaimResult[] memory) {
        uint256 validCount = 0;
        // First pass: นับจำนวนรางวัลที่มีผู้ถูกรางวัล
        for (uint256 i = 1; i <= roundId; i++) {
            if (!rounds[i].isDrawn) {
                continue;
            }
            for (uint256 prize = 0; prize < 3; prize++) {
                uint256 winningNumber = rounds[i].winningNumbers[prize];
                address winner = getUserForTicket(i, winningNumber);
                if (winner != address(0)) {
                    validCount++;
                }
            }
        }

        ClaimResult[] memory winningResults = new ClaimResult[](validCount);
        uint256 index = 0;
        // Second pass: เก็บข้อมูลผู้ถูกรางวัล
        for (uint256 i = 1; i <= roundId; i++) {
            if (!rounds[i].isDrawn) {
                continue;
            }
            for (uint256 prize = 0; prize < 3; prize++) {
                uint256 winningNumber = rounds[i].winningNumbers[prize];
                address winner = getUserForTicket(i, winningNumber);
                if (winner != address(0)) {
                    winningResults[index] = ClaimResult({
                        user: winner,
                        roundId: i,
                        ticketNumber: winningNumber,
                        ticketType: _getTicketType(i, winningNumber),
                        prizeRank: prize // 0 = First Prize, 1 = Second Prize, 2 = Third Prize
                    });
                    index++;
                }
            }
        }
        return winningResults;
    }
    // Helper function to get the ticket type (single or pair)
    function _getTicketType(
        uint256 _roundId,
        uint256 _ticketNumber
    ) internal view returns (string memory) {
        bool isSingleTicket = _isInSingleTickets(_roundId, _ticketNumber);
        if (isSingleTicket) {
            return "single";
        } else {
            return "pair";
        }
    }

    // Helper function to check if ticket is in single tickets
    function _isInSingleTickets(
        uint256 _roundId,
        uint256 _ticketNumber
    ) internal view returns (bool) {
        for (uint256 i = 0; i < rounds[_roundId].singleTickets.length; i++) {
            if (rounds[_roundId].singleTickets[i] == _ticketNumber) {
                return true;
            }
        }
        return false;
    }
}
