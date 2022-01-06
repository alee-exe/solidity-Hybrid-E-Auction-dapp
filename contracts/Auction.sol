// SPDX-License-Identifier: MIT
pragma solidity >=0.4.22 <0.9.0;

contract Auction {
    // State variables, uint256 = unsigned integer of 256 bits, address = Ethereum account addresses (20 bytes)

    // Store's the auction owner = contract owner
    address public owner;
    // Auction start and end times (since unix epoch in seconds)
    uint256 public startBlockTimeStamp;
    uint256 public endBlockTimeStamp;
    // Highest bid in Ether
    uint256 public highestBid;
    // Address of current highest bidder
    address public highestBidder;

    // Auction state
    enum STATUS {
        CANCELLED,
        ONGOING,
        ENDED
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
        startBlockTimeStamp = block.timestamp;
        // time is in hours
        endBlockTimeStamp = startBlockTimeStamp + (_biddingTime * 1 hours);
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
    mapping(address => uint256) public trackAllBids;

    // require will refund the remaining gas to the caller
    modifier only_ongoing() {
        require(auctionStatus == STATUS.ONGOING, "Auction status must be ONGOING.");
        _;
    }

    // makes the contract ownable - giving contract owner specific priviledges
    modifier only_owner(address _user) {
        require(_user == owner, "Must be the contract owner.");
        _;
    }

    modifier not_ended() {
        require(block.timestamp <= endBlockTimeStamp, "Auction must not be ended.");
        _;
    }

    modifier is_ended() {
        require(block.timestamp >= endBlockTimeStamp, "Auction must be ended.");
        _;
    }

    function placeBid(address _bidder) public payable only_ongoing not_ended returns (bool) {
        require(
            msg.value > highestBid,
            "Placed bid must be greater than highest bid."
        );

        highestBidder = _bidder;
        highestBid = msg.value;
        bidders.push(highestBidder);

        trackAllBids[highestBidder] = trackAllBids[highestBidder] + msg.value;

        emit bidEvent(highestBidder, highestBid);

        return true;
    }

    function withdrawBid(address _bidder) public returns (bool) {
        require(
            block.timestamp > endBlockTimeStamp || auctionStatus != STATUS.ONGOING,
            "You can only withdraw at the end of the auction or when it is cancelled."
        );

        require(trackAllBids[_bidder] > 0, "You've already withdrawn from this auction.");
        uint256 amount;

        // Find bid placed by address of bidder (hash map)
        amount = trackAllBids[_bidder];
        // Set current bid by withdrawer to 0 (update hash map)
        trackAllBids[_bidder] = 0;
        // Transfer back funds
        payable(_bidder).transfer(amount);
        // Trigger event
        emit withdrawalEvent(_bidder, amount);

        return true;
    }

    function cancelAuction(address _owner) public only_owner(_owner) only_ongoing returns (STATUS) {
        auctionStatus = STATUS.CANCELLED;
        emit statusEvent("Auction state is cancelled.", block.timestamp);

        return auctionStatus;
    }

    function endAuction() public is_ended returns (STATUS) {
        auctionStatus = STATUS.ENDED;
        emit statusEvent("Auction state is ended.", block.timestamp);

        return auctionStatus;
    }

    event bidEvent(address indexed highestBidder, uint256 highestBid);
    event withdrawalEvent(address withdrawer, uint256 amount);
    event statusEvent(string message, uint256 time);
}
