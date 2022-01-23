// SPDX-License-Identifier: MIT
pragma solidity >=0.4.22 <0.9.0;

import "truffle/Assert.sol";
import "truffle/DeployedAddresses.sol";
import "../contracts/Auction.sol";

contract TestAuction {
    // This Smart Contract Test aims to verify the deployed Auction contract is initialised and its methods function correctly

    Auction auction = Auction(DeployedAddresses.Auction());

    function testAuctionGetOwner() public {
        address returnedOwner = auction.owner();
        Assert.equal(returnedOwner, address(0x3d6f78575b3E70a45dC7ddb1fd89F12C7b0E7ed8), "Owner address should match.");
    }

    function testAuctionGetEndBlockTimeStamp() public {
        uint256 returnedStartBlockTimeStamp = auction.startBlockTimeStamp();
        uint256 returnedEndBlockTimeStamp = auction.endBlockTimeStamp();
        uint256 endBlockTimeStamp = returnedStartBlockTimeStamp + (10 * 1 hours);
        Assert.equal(returnedEndBlockTimeStamp, endBlockTimeStamp, "End Block Bidding Time should match.");
    }

    function testAuctionGetSellingPrice() public {
        uint256 returnedSellingPrice = auction.sellingPrice();
        Assert.equal(returnedSellingPrice, uint256(100), "Selling Price should match.");
    }

    function testAuctionGetStartingBid() public {
        uint256 returnedStartingBid = auction.startingBid();
        Assert.equal(returnedStartingBid, uint256(2), "Starting Bid should match.");
    }

    function testAuctionGetBidIncrement() public {
        uint256 returnedBidIncrement = auction.bidIncrement();
        Assert.equal(returnedBidIncrement, uint256(1), "Bid Increment should match.");
    }

    function testAuctionGetIsPrivate() public {
        bool returnedIsPrivate = auction.isPrivate();
        Assert.equal(returnedIsPrivate, bool(false), "Auction Type should match.");
    }

    function testAuctionGetItem() public {
        // Auctioned Item is a Tuple
        (string memory returnedItemName, string memory returnedItemCondition, string memory returnedItemDescription, string memory returnedItemIpfsHash) = auction.auctionedItem();
        Assert.equal(returnedItemName, string("Porsche 911"), "Item Name should match.");
        Assert.equal(returnedItemCondition, string("Used"), "Item Condition should match.");
        Assert.equal(returnedItemDescription, string("Full Porsche Hatfield service history, 40.670 miles."), "Item Description should match.");
        Assert.equal(returnedItemIpfsHash, string("Placeholder"), "Item Ipfs Hash should match.");
    }

}