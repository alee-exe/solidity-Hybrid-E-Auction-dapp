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
    // Minimum starting bid
    uint256 public startingBid;
    // Bid increment/step
    uint256 public bidIncrement;
    // Buyout/Selling price
    uint256 public sellingPrice;
    // Auction Type (Public or Private)
    bool public isPrivate;
    // Track number of total bids
    uint256 public numberOfTotalBids;


    // Auction states
    enum STATE {
        CANCELLED,
        ONGOING,
        ENDED
    }

    STATE public auctionStatus;

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
        uint256 _startingBid,
        uint256 _bidIncrement,
        uint256 _sellingPrice,
        bool _isPrivate,
        string memory _name,
        string memory _condition,
        string memory _description,
        string memory _ipfsImageHash
    ) {
        owner = _owner;
        startBlockTimeStamp = block.timestamp;
        // time is in hours
        endBlockTimeStamp = startBlockTimeStamp + (_biddingTime * 1 hours);
        auctionStatus = STATE.ONGOING;
        startingBid = _startingBid;
        bidIncrement = _bidIncrement;
        sellingPrice = _sellingPrice;
        isPrivate = _isPrivate;
        auctionedItem.name = _name;
        auctionedItem.condition = _condition;
        auctionedItem.description = _description;
        auctionedItem.ipfsImageHash = _ipfsImageHash;
    }

    // maps all bidders with their current bids, hash map (KeyType => ValueType)
    // variables with the public modifier have automatic getters
    mapping(address => uint256) public trackAllBids;

    // makes the contract ownable - giving contract owner specific priviledges
    modifier only_owner(address _user) {
        // require will refund the remaining gas to the caller
        require(_user == owner, "Only Auction owner is allowed to perform this operation.");
        _;
    }

    modifier is_ongoing() {
        require(auctionStatus == STATE.ONGOING, "Auction status must be ONGOING.");
        _;
    }

    modifier is_expired() {
        require(auctionStatus != STATE.ONGOING, "Auction status must be EXPIRED (CANCELLED OR ENDED).");
        _;
    }

    modifier only_bidder(address _user) {
        require(_user != owner, "Only bidders are allowed to perform this operation.");
        _;
    }

    function placeBid(address _bidder)
        public
        payable
        is_ongoing
        only_bidder(_bidder)
        returns (bool)
    {
        if (startingBid > 0 ) {
            require(msg.value >= startingBid, "Initial bid must be greater or equal to starting bid.");
        }

        // prevent escrow bidding
        if (trackAllBids[_bidder] > 0) {
            payable(_bidder).transfer(trackAllBids[_bidder]);
            trackAllBids[_bidder] = 0;
        }

        // if Auction type is Private then change bid handling and requirements
        if (isPrivate) {
            if (bidIncrement > 0 ) {
                require(msg.value >= trackAllBids[_bidder] + bidIncrement, "Placed bid must be greater than your current bid + bid increment.");
            } else {
                require(msg.value > trackAllBids[_bidder], "Placed bid must be greater than your current highest bid.");
            }

            // if two bidders have the same highest bid - select the bidder with the first highest bid
            if (msg.value > trackAllBids[highestBidder]) {
                highestBidder = _bidder;
                highestBid = msg.value;
            }

            trackAllBids[_bidder] += msg.value;

        } else {
            if (bidIncrement > 0 ) {
                require(msg.value >= highestBid + bidIncrement, "Placed bid must be greater than highest bid + bid increment.");
            } else {
                require(msg.value > highestBid, "Placed bid must be greater than highest bid.");
            }

            highestBidder = _bidder;
            // msg.value is the bid value in wei
            highestBid = msg.value;
            trackAllBids[highestBidder] += msg.value;
        }

        numberOfTotalBids++;
        emit bidEvent(highestBidder, highestBid);
        return true;
    }

    function withdrawBid(address _bidder) public is_expired only_bidder(_bidder) returns (bool) {
        require(trackAllBids[_bidder] > 0, "You've already withdrawn from this Auction.");
      
        // Find bid placed by address of bidder (hash map)
        uint256 amount = trackAllBids[_bidder];
        // Set current bid by withdrawer to 0 (update hash map)
        trackAllBids[_bidder] = 0;
        // Transfer back funds
        payable(_bidder).transfer(amount);
        // Trigger event
        emit withdrawalEvent(_bidder, amount);

        return true;
    }

    function claimWinningBid(address _owner)
        public
        only_owner(_owner)
        is_expired
        returns (bool)
    {
        require(trackAllBids[highestBidder] > 0, "Highest bidder must have a bid greater than 0 ETH to claim.");
        uint256 winningAmount = trackAllBids[highestBidder];

        trackAllBids[highestBidder] = 0;
        payable(_owner).transfer(winningAmount);
        return true;
    }

    function cancelAuction(address _owner)
        public
        only_owner(_owner)
        is_ongoing
        returns (STATE)
    {
        require(auctionStatus != STATE.ENDED, "Cannot cancel an Auction that has ended.");
        auctionStatus = STATE.CANCELLED;
        emit statusEvent("Auction state is cancelled.", block.timestamp);

        return auctionStatus;
    }

    function endAuction() public is_ongoing returns (STATE) {
        auctionStatus = STATE.ENDED;
        emit statusEvent("Auction state is ended.", block.timestamp);

        return auctionStatus;
    }

    event bidEvent(address indexed highestBidder, uint256 highestBid);
    event withdrawalEvent(address withdrawer, uint256 amount);
    event statusEvent(string message, uint256 time);
}
