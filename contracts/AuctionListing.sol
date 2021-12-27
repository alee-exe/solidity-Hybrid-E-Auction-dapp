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
        string memory _description
    ) public {
        Auction newAuction = new Auction(
            _biddingTime,
            msg.sender,
            _name,
            _condition,
            _description
        );

        listedAuctions.push(newAuction);
        emit AuctionCreated(msg.sender, listedAuctions.length);
    }
}