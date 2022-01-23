var Auction = artifacts.require("./Auction.sol");
var AuctionListing = artifacts.require("./AuctionListing.sol");


module.exports = function(deployer) {
    // Truffle test for a single Auction
    deployer.deploy(Auction, "0x3d6f78575b3E70a45dC7ddb1fd89F12C7b0E7ed8", 10, 100, 2, 1, false, "Porsche 911", "Used", "Full Porsche Hatfield service history, 40.670 miles.", "Placeholder");
    // Used for E-Auction application
    deployer.deploy(AuctionListing);
};