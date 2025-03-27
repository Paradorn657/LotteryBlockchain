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
    event UserWon(address indexed user, uint256 roundId, uint256 ticketNumber, uint256 prizeRank);
    
    struct Round {
        uint256 totalEntries; // จำนวน entry ทั้งหมด = จำนวนหวยเดี่ยว + จำนวนหวยชุด
        uint256[] singleTickets;  // เก็บเลขหวยเดี่ยว (แต่ละใบเป็น entry หนึ่ง)
        uint256[] pairTickets;    // เก็บเลขหวยชุด (แต่ละชุดเก็บ entry เดียว)
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

    mapping(uint256 => address[]) public roundUsers;  // Track users per round
    mapping(uint256 => mapping(address => bool)) public userInRound;  // Quick lookup if user is in round

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
        rounds[roundId].createdDate = block.timestamp; // บันทึกวันที่สร้าง round

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
        require(rounds[_roundId].totalEntries > 0, "Round does not exist");
        require(!rounds[_roundId].isDrawn, "This round has already been drawn");
        
        // Track if this is the first ticket for this user in this round
        bool isFirstTicketForUser = userTickets[_user][_roundId].length == 0;
        
        for (uint256 i = 0; i < _ticketNumbers.length; i++) {
            uint256 ticketNumber = _ticketNumbers[i];
            bool ticketExists = false;
            
            // Check single tickets
            for (uint256 j = 0; j < rounds[_roundId].singleTickets.length; j++) {
                if (rounds[_roundId].singleTickets[j] == ticketNumber) {
                    ticketExists = true;
                    break;
                }
            }
            
            // Check pair tickets if not found in single tickets
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

    function getUsersInRound(uint256 _roundId) external view returns (address[] memory) {
        return roundUsers[_roundId];
    }

    // New function to check if a user is in a specific round
    function isUserInRound(uint256 _roundId, address _user) external view returns (bool) {
        return userInRound[_roundId][_user];
    }

    function getAllUserTickets(address _user) external view returns (UserTickets[] memory) {
        uint256 totalRounds = roundId;
        uint256 validRounds = 0;
        for (uint256 i = 1; i <= totalRounds; i++) {
            if (userTickets[_user][i].length > 0) {
                validRounds++;
            }
        }
        
        UserTickets[] memory userTicketsArray = new UserTickets[](validRounds);
        uint256 index = 0;
        for (uint256 i = 1; i <= totalRounds; i++) {
            uint256[] memory ticketsInRound = userTickets[_user][i];
            if (ticketsInRound.length > 0) {
                userTicketsArray[index] = UserTickets(i, ticketsInRound);
                index++;
            }
        }
        return userTicketsArray;
    }

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
    
    function drawWinners(uint256 _roundId) external onlyOwner returns (uint256 roundDrawn, uint256[3] memory winningNumbers) {
        require(rounds[_roundId].totalEntries > 0, "Round does not exist");
        require(!rounds[_roundId].isDrawn, "Winners already drawn");

        uint256[] memory entries = _getCombinedEntries(_roundId);
        require(entries.length >= 3, "Not enough entries to draw");

        uint256[3] memory generatedWinningNumbers;
        uint256 randomIndex;
        
        // 1st Prize
        randomIndex = uint256(keccak256(abi.encodePacked(block.timestamp, msg.sender, uint256(0)))) % entries.length;
        generatedWinningNumbers[0] = entries[randomIndex];

        // 2nd Prize (ensure different from 1st)
        do {
            randomIndex = uint256(keccak256(abi.encodePacked(block.timestamp, msg.sender, uint256(1)))) % entries.length;
        } while (generatedWinningNumbers[0] == entries[randomIndex]);
        generatedWinningNumbers[1] = entries[randomIndex];

        // 3rd Prize (ensure different from 1st and 2nd)
        do {
            randomIndex = uint256(keccak256(abi.encodePacked(block.timestamp, msg.sender, uint256(2)))) % entries.length;
        } while (generatedWinningNumbers[0] == entries[randomIndex] || generatedWinningNumbers[1] == entries[randomIndex]);
        generatedWinningNumbers[2] = entries[randomIndex];

        rounds[_roundId].winningNumbers = generatedWinningNumbers;
        rounds[_roundId].isDrawn = true;

        emit LotteryDrawn(_roundId, generatedWinningNumbers[0], generatedWinningNumbers[1], generatedWinningNumbers[2]);

        return (_roundId, generatedWinningNumbers);
    }

    function autoClaimRoundWinnings(uint256 _roundId) external returns (ClaimResult[] memory) {
        // Ensure winners have been drawn for this round
        require(rounds[_roundId].isDrawn, "Winners not drawn yet");
        
        // Get all users who participated in this round
        address[] memory usersInRound = roundUsers[_roundId];
        
        // Prepare a dynamic array to store all claim results
        ClaimResult[] memory allClaimResults;
        uint256 totalClaimResultsCount = 0;

        // Loop through each user in the round
        for (uint256 userIndex = 0; userIndex < usersInRound.length; userIndex++) {
            address currentUser = usersInRound[userIndex];
            
            // Get the user's tickets for the specific round
            uint256[] memory userTicketsInRound = userTickets[currentUser][_roundId];
            
            // Skip if user has no tickets
            if (userTicketsInRound.length == 0) {
                continue;
            }
            
            // Process claim results for this user
            ClaimResult[] memory userClaimResults = _processUserClaims(_roundId, currentUser, userTicketsInRound);
            
            // If user has winning tickets, add to total results
            if (userClaimResults.length > 0) {
                // Expand the allClaimResults array
                ClaimResult[] memory tempResults = new ClaimResult[](totalClaimResultsCount + userClaimResults.length);
                
                // Copy existing results
                for (uint256 j = 0; j < totalClaimResultsCount; j++) {
                    tempResults[j] = allClaimResults[j];
                }
                
                // Add new user results
                for (uint256 j = 0; j < userClaimResults.length; j++) {
                    tempResults[totalClaimResultsCount + j] = userClaimResults[j];
                }
                
                // Update the results array and count
                allClaimResults = tempResults;
                totalClaimResultsCount += userClaimResults.length;
            }
        }

        return allClaimResults;
    }

    function isInArray(uint256[] memory arr, uint256 value) internal pure returns (bool) {
        for (uint256 i = 0; i < arr.length; i++) {
            if (arr[i] == value) {
                return true;
            }
        }
        return false;
    }

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

    // ฟังก์ชัน getDateRoundbyId() คืนค่า timestamp ของวันที่สร้าง round นั้น
    function getDateRoundbyId(uint256 _roundId) external view returns (uint256) {
        require(rounds[_roundId].totalEntries > 0, "Round does not exist");
        return rounds[_roundId].createdDate;
    }
    function getUserForTickets(uint256 _roundId) internal view returns (address) {
        // Placeholder implementation - replace with actual logic to find a user who bought tickets in a round
        // This might require additional tracking in your buyTickets function
        for (address user = address(1); user < address(type(uint160).max); user = address(uint160(uint256(uint160(user)) + 1))) {
            if (userTickets[user][_roundId].length > 0) {
                return user;
            }
        }
        return address(0);
    }
    function getUserWinningCount(address _user) external view returns (uint256) {
        return userWinnings[_user].length;
    }
    function getUserWinnings(address _user) external view returns (UserWinning[] memory) {
        return userWinnings[_user];
    }

    function printRoundResults(uint256 _roundId) external view returns (string memory) {
        // First, check if winners have been drawn
        require(rounds[_roundId].isDrawn, "Winners not drawn yet");
        
        // Prepare initial results string
        string memory results = _prepareInitialResults(_roundId);
        
        // Get all users who participated in this round
        address[] memory usersInRound = roundUsers[_roundId];
        
        // Track overall round statistics
        uint256 totalUsers;
        uint256 totalTickets;
        uint256 totalWinningTickets;
        
        // Prepare results for each user
        for (uint256 userIndex = 0; userIndex < usersInRound.length; userIndex++) {
            address currentUser = usersInRound[userIndex];
            
            // Get the user's tickets for the specific round
            uint256[] memory userTicketsInRound = userTickets[currentUser][_roundId];
            
            // Skip if user has no tickets
            if (userTicketsInRound.length == 0) {
                continue;
            }
            
            // Process user's tickets and generate result
            UserRoundResult memory userResult = _processUserTickets(_roundId, currentUser, userTicketsInRound);
            
            // Only add if user has tickets
            if (userResult.hasTickets) {
                results = string(abi.encodePacked(results, userResult.resultString));
                
                // Update overall statistics
                totalUsers++;
                totalTickets += userResult.totalTickets;
                totalWinningTickets += userResult.winningTickets;
            }
        }
        
        // Add overall round summary
        results = string(abi.encodePacked(
            results,
            "Round Summary:\n",
            "Total Participating Users: ", _toString(totalUsers), "\n",
            "Total Tickets Sold: ", _toString(totalTickets), "\n",
            "Total Winning Tickets: ", _toString(totalWinningTickets), "\n"
        ));
        
        return results;
    }

    // Struct to help manage user round results and reduce stack depth
    struct UserRoundResult {
        bool hasTickets;
        uint256 totalTickets;
        uint256 winningTickets;
        string resultString;
    }

    // Helper function to prepare initial results string
    function _prepareInitialResults(uint256 _roundId) internal view returns (string memory) {
        return string(abi.encodePacked(
            "Lottery Round ", 
            _toString(_roundId), 
            " Results:\n",
            "Winning Numbers: ",
            _toString(rounds[_roundId].winningNumbers[0]), ", ",
            _toString(rounds[_roundId].winningNumbers[1]), ", ",
            _toString(rounds[_roundId].winningNumbers[2]), 
            "\n\n"
        ));
    }

    // Helper function to process user's tickets
    function _processUserTickets(
        uint256 _roundId, 
        address _user, 
        uint256[] memory _userTicketsInRound
    ) internal view returns (UserRoundResult memory) {
        UserRoundResult memory result;
        result.hasTickets = false;
        result.totalTickets = _userTicketsInRound.length;
        
        // Start user result string
        result.resultString = string(abi.encodePacked(
            "User ", 
            _addressToString(_user), 
            ":\n"
        ));
        
        // Winning numbers for reference
        uint256[3] memory winningNumbers = rounds[_roundId].winningNumbers;
        
        // Process each ticket
        for (uint256 j = 0; j < _userTicketsInRound.length; j++) {
            uint256 ticketNumber = _userTicketsInRound[j];
            string memory ticketType = _determineTicketType(_roundId, ticketNumber);
            string memory prizeStatus = _checkPrizeStatus(_roundId, ticketNumber, winningNumbers);
            
            // Create ticket result line
            string memory resultLine = string(abi.encodePacked(
                "  Ticket ", 
                _toString(ticketNumber), 
                " (", 
                ticketType, 
                " Ticket) - ", 
                prizeStatus, 
                "\n"
            ));
            
            result.resultString = string(abi.encodePacked(result.resultString, resultLine));
            
            // Update winning tickets if prize won
            if (keccak256(abi.encodePacked(prizeStatus)) != keccak256(abi.encodePacked("No Prize"))) {
                result.winningTickets++;
            }
        }
        
        // Add user summary
        result.resultString = string(abi.encodePacked(
            result.resultString,
            "  Total Tickets: ", 
            _toString(result.totalTickets),
            "\n  Winning Tickets: ", 
            _toString(result.winningTickets),
            "\n\n"
        ));
        
        result.hasTickets = true;
        return result;
    }

    // Helper function to determine ticket type
    function _determineTicketType(uint256 _roundId, uint256 _ticketNumber) internal view returns (string memory) {
        // Check single tickets
        for (uint256 i = 0; i < rounds[_roundId].singleTickets.length; i++) {
            if (rounds[_roundId].singleTickets[i] == _ticketNumber) {
                return "Single";
            }
        }
        
        // Check pair tickets
        for (uint256 i = 0; i < rounds[_roundId].pairTickets.length; i++) {
            if (rounds[_roundId].pairTickets[i] == _ticketNumber) {
                return "Pair";
            }
        }
        
        return "Unknown";
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
    // Helper function to convert uint to string
    function _toString(uint256 value) internal pure returns (string memory) {
        if (value == 0) {
            return "0";
        }
        uint256 temp = value;
        uint256 digits;
        while (temp != 0) {
            digits++;
            temp /= 10;
        }
        bytes memory buffer = new bytes(digits);
        while (value != 0) {
            digits -= 1;
            buffer[digits] = bytes1(uint8(48 + uint256(value % 10)));
            value /= 10;
        }
        return string(buffer);
    }

    // Helper function to convert address to string
    function _addressToString(address _addr) internal pure returns (string memory) {
        bytes32 value = bytes32(uint256(uint160(_addr)));
        bytes memory alphabet = "0123456789abcdef";
        
        bytes memory str = new bytes(42);
        str[0] = '0';
        str[1] = 'x';
        
        for (uint256 i = 0; i < 20; i++) {
            str[2+i*2] = alphabet[uint8(value[i + 12] >> 4)];
            str[3+i*2] = alphabet[uint8(value[i + 12] & 0x0f)];
        }
        
        return string(str);
    }

    function _processUserClaims(
        uint256 _roundId, 
        address _user, 
        uint256[] memory _userTicketsInRound
    ) internal returns (ClaimResult[] memory) {
        uint256[3] memory winningNumbers = rounds[_roundId].winningNumbers;
        
        // Prepare claim results array (maximum size is user's ticket count)
        ClaimResult[] memory claimResults = new ClaimResult[](_userTicketsInRound.length);
        uint256 resultsCount = 0;

        for (uint256 j = 0; j < _userTicketsInRound.length; j++) {
            uint256 ticketNumber = _userTicketsInRound[j];
            uint256 prizeRank = 3; // Default to no prize
            
            // Validate ticket type
            bool isValidTicket = _isValidTicket(_roundId, ticketNumber);
            
            // Determine prize rank
            if (ticketNumber == winningNumbers[0]) {
                prizeRank = 0; // First Prize
            } else if (ticketNumber == winningNumbers[1]) {
                prizeRank = 1; // Second Prize
            } else if (ticketNumber == winningNumbers[2]) {
                prizeRank = 2; // Third Prize
            }
            
            // Only add to results if there's a prize and valid ticket
            if (prizeRank < 3) {
                claimResults[resultsCount] = ClaimResult({
                    user: _user,
                    roundId: _roundId,
                    ticketNumber: ticketNumber,
                    ticketType: isValidTicket ? 
                        (_isInSingleTickets(_roundId, ticketNumber) ? "single" : "pair") : 
                        "none",
                    prizeRank: prizeRank
                });
                
                // Add to user winnings
                userWinnings[_user].push(UserWinning(_roundId, ticketNumber, prizeRank));
                
                // Emit event for each winning ticket
                emit UserWon(_user, _roundId, ticketNumber, prizeRank);
                
                resultsCount++;
            }
        }
        
        // Resize the array to only include actual results
        ClaimResult[] memory finalResults = new ClaimResult[](resultsCount);
        for (uint256 i = 0; i < resultsCount; i++) {
            finalResults[i] = claimResults[i];
        }
        
        return finalResults;
    }

        // Internal function to check if ticket is valid
    function _isValidTicket(uint256 _roundId, uint256 _ticketNumber) internal view returns (bool) {
        // Check single tickets
        for (uint256 i = 0; i < rounds[_roundId].singleTickets.length; i++) {
            if (rounds[_roundId].singleTickets[i] == _ticketNumber) {
                return true;
            }
        }
        
        // Check pair tickets
        for (uint256 i = 0; i < rounds[_roundId].pairTickets.length; i++) {
            if (rounds[_roundId].pairTickets[i] == _ticketNumber) {
                return true;
            }
        }
        
        return false;
    }

    // Internal function to check if ticket is in single tickets
    function _isInSingleTickets(uint256 _roundId, uint256 _ticketNumber) internal view returns (bool) {
        for (uint256 i = 0; i < rounds[_roundId].singleTickets.length; i++) {
            if (rounds[_roundId].singleTickets[i] == _ticketNumber) {
                return true;
            }
        }
        return false;
    }
}
