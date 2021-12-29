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
}