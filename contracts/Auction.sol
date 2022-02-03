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
    //If Auction Item is purchased
    address public purchaser;

    // Auction states
    enum STATE {
        CANCELLED,
        ONGOING,
        ENDED,
        SOLD
    }

    STATE public auctionStatus;

    // structure is a collection of variables that can contain different data types
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
        uint256 _sellingPrice,
        uint256 _startingBid,
        uint256 _bidIncrement,
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
        sellingPrice = _sellingPrice;
        startingBid = _startingBid;
        bidIncrement = _bidIncrement;
        isPrivate = _isPrivate;
        auctionedItem.name = _name;
        auctionedItem.condition = _condition;
        auctionedItem.description = _description;
        auctionedItem.ipfsImageHash = _ipfsImageHash;
    }

    // maps all bidders with their current bids, hash map (KeyType => ValueType)
    // variables with the public modifier have automatic getters
    mapping(address => uint256) public trackAllBids;

      // require modifiers will refund the remaining gas to the caller if incorrectly invoked
    modifier only_owner(address _user) {
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

            checkEscrowBidding(_bidder);
            trackAllBids[_bidder] += msg.value;
        } else {
            if (bidIncrement > 0 ) {
                require(msg.value >= highestBid + bidIncrement, "Placed bid must be greater than highest bid + bid increment.");
            } else {
                require(msg.value > highestBid, "Placed bid must be greater than highest bid.");
            }

            checkEscrowBidding(_bidder);
            highestBidder = _bidder;
            // msg.value is the bid value in wei
            highestBid = msg.value;
            trackAllBids[highestBidder] += msg.value;
        }

        numberOfTotalBids++;
        emit bidEvent(_bidder, msg.value);
        return true;
    }

    function checkEscrowBidding(address _bidder) private returns (bool) {
        // prevent escrow bidding
        if (trackAllBids[_bidder] > 0) {
            payable(_bidder).transfer(trackAllBids[_bidder]);
            trackAllBids[_bidder] = 0;
        }
        return true;
    }

    function withdrawBid(address _bidder) public is_expired only_bidder(_bidder) returns (bool) {
        require(trackAllBids[_bidder] > 0, "You've already withdrawn from this Auction.");
      
        uint256 amount = trackAllBids[_bidder];
        trackAllBids[_bidder] = 0;
        payable(_bidder).transfer(amount);
        return true;
    }

     function buyAuction(address _bidder) public payable is_ongoing only_bidder(_bidder) returns (STATE) {
        require(sellingPrice > 0, "Auction Price must be greater than 0 ETH to buy.");
        require(msg.value == sellingPrice, "Sent ETH value must be equal to Selling Price.");

        auctionStatus = STATE.SOLD;
        purchaser = _bidder;
        payable(owner).transfer(msg.value);
        emit stateEvent(purchaser, auctionStatus);
        return auctionStatus;
    }

    function claimWinningBid(address _owner)
        public
        only_owner(_owner)
        returns (bool)
    {
        require(trackAllBids[highestBidder] > 0, "Highest bidder must have placed a bid greater than 0 ETH to claim.");
        require(auctionStatus == STATE.ENDED, "Auction status must be ENDED.");

        uint256 winningAmount = trackAllBids[highestBidder];
        trackAllBids[highestBidder] = 0;
        payable(_owner).transfer(winningAmount);
        return true;
    }

    function endAuction(address _user) public is_ongoing returns (STATE) {
        auctionStatus = STATE.ENDED;
        emit stateEvent(_user, auctionStatus);
        return auctionStatus;
    }

    function cancelAuction(address _owner)
        public
        only_owner(_owner)
        is_ongoing
        returns (STATE)
    {
        auctionStatus = STATE.CANCELLED;
        emit stateEvent(owner, auctionStatus);
        return auctionStatus;
    }

    event bidEvent(address indexed bidder, uint256 bidValue);
    event stateEvent(address indexed caller, STATE auctionStatus);
}
