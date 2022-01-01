// SPDX-License-Identifier: MIT
pragma solidity >=0.4.22 <0.9.0;

import "./Auction.sol";

contract AuctionListing {
    // Hold all auction objects
    Auction[] public listedAuctions;

    event AuctionCreated(address owner, uint256 totalAuctions);

    function createAuction(
        uint256 _biddingTime,
        string memory _name,
        string memory _condition,
        string memory _description,
        string memory _ipfsImageHash
    ) public {
        Auction createdAuction = new Auction(
            msg.sender,
            _biddingTime,
            _name,
            _condition,
            _description,
            _ipfsImageHash    
        );

        listedAuctions.push(createdAuction);
        emit AuctionCreated(msg.sender, listedAuctions.length);
    }

    function getListedAuctions() public view returns (Auction[] memory) {
        return listedAuctions;
    }

    function getOwner(uint _i) public view returns (address) {
        return listedAuctions[_i].owner();
    }

    function getStartBlockTimeStamp(uint _i) public view returns (uint256) {
        return listedAuctions[_i].startBlockTimeStamp();
    }

    function getEndBlockTimeStamp(uint _i) public view returns (uint256) {
        return listedAuctions[_i].endBlockTimeStamp();
    }

    function getAuctionedItem(uint _i) public view returns (string memory, string memory, string memory, string memory) {
        return listedAuctions[_i].auctionedItem();
    }

    function getHighestBidder(uint _i) public view returns (address) {
        return listedAuctions[_i].highestBidder();
    }

    function getHighestBid(uint _i) public view returns (uint256) {
        return listedAuctions[_i].highestBid();
    }

    function getAuctionStatus(uint _i) public view returns (Auction.STATUS) {
        return listedAuctions[_i].auctionStatus();
    }

    function placeBid(uint _i) public payable returns (bool) {
        return listedAuctions[_i].placeBid{value:msg.value}(msg.sender);
    }

     function withdraw(uint _i) public payable returns (bool) {
        return listedAuctions[_i].withdraw(msg.sender);
    }

    function getUserTotalBids(uint _i, address _bidder) public view returns (uint256) {
        return listedAuctions[_i].trackAllBids(_bidder);
    }

}