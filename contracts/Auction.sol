// SPDX-License-Identifier: MIT
pragma solidity >=0.4.22 <0.9.0;

contract Auction {
    // State variables, uint256 = unsigned integer of 256 bits, address = Ethereum account addresses (20 bytes)

    // Store's the auction owner = contract owner
    address internal owner;
    // Auction start and end times (since unix epoch in seconds)
    uint256 public startBlockTime;
    uint256 public endBlockTime;
    // Highest bid in Ether
    uint256 public highestBid;
    // Address of current highest bidder
    address public highestBidder;

    // Auction state
    enum STATUS {
        CANCELLED,
        ONGOING
    }

    STATUS public auctionStatus;

    // structure is a collection of variables using different data types
    // we define an Item structure for the auctioned item
    struct Item {
        string name;
        string condition;
        string description;
        string ipfsImageHash;
    }

    Item public auctionedItem;

    constructor(
        address _owner,
        uint256 _biddingTime,
        string memory _name,
        string memory _condition,
        string memory _description,
        string memory _ipfsImageHash
         
    ) {
        owner = _owner;
        startBlockTime = block.timestamp;
        // time is in hours
        endBlockTime = startBlockTime + _biddingTime * 1 hours;
        auctionStatus = STATUS.ONGOING;
        auctionedItem.name = _name;
        auctionedItem.condition = _condition;
        auctionedItem.description = _description;
        auctionedItem.ipfsImageHash = _ipfsImageHash;
    }

    // dynamic array of all bidder's addresses
    address[] bidders;
    // bids - maps all bidders with their total bids, hash map (KeyType => ValueType)
    // variables with the public modifier have automatic getters
    mapping(address => uint256) public bids;

    // require will refund the remaining gas to the caller
    modifier only_ongoing() {
        require(auctionStatus == STATUS.ONGOING, "Auction status must be ONGOING.");
        _;
    }

    // makes the contract ownable - giving contract owner specific priviledges
    modifier only_owner() {
        require(msg.sender == owner, "Must be the contract owner.");
        _;
    }

    modifier not_ended() {
        require(block.timestamp <= endBlockTime);
        _;
    }

    function getOwner() public view returns (address) {
        return owner;
    }

    function placeBid() public payable only_ongoing not_ended returns (bool) {
        require(
            msg.value > highestBid,
            "Placed bid must be greater than highest bid."
        );

        highestBidder = msg.sender;
        highestBid = msg.value;
        bidders.push(msg.sender);

        bids[msg.sender] = bids[msg.sender] + msg.value;

        emit bidEvent(highestBidder, highestBid);

        return true;
    }

    function withdraw() public returns (bool) {
        require(
            block.timestamp > endBlockTime || auctionStatus != STATUS.ONGOING,
            "You can only withdraw at the end of the auction."
        );

        require(bids[msg.sender] > 0, "You've already withdrawn from this auction.");
        uint256 amount;

        // Find bid placed by address of bidder (hash map)
        amount = bids[msg.sender];
        // Set current bid by withdrawer to 0 (update hash map)
        bids[msg.sender] = 0;
        // Transfer back funds
        payable(msg.sender).transfer(amount);
        // Trigger event
        emit withdrawalEvent(msg.sender, amount);

        return true;
    }

    function setAuctionStatus(uint _status) public {
        auctionStatus = STATUS(_status);
    }

    function cancelAuction() public only_owner only_ongoing returns (STATUS) {
        setAuctionStatus(0);
        emit enumEvent("Auction state has changed.", block.timestamp);

        return auctionStatus;
    }

    event bidEvent(address indexed highestBidder, uint256 highestBid);
    event withdrawalEvent(address withdrawer, uint256 amount);
    event enumEvent(string message, uint256 time);
}
