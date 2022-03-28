var Auction = artifacts.require("./Auction.sol");
var AuctionListing = artifacts.require("./AuctionListing.sol");

module.exports = function(deployer) {
    // Truffle test for a single auction smart contract
    deployer.deploy(Auction, "0x3d6f78575b3E70a45dC7ddb1fd89F12C7b0E7ed8", "Tel: 123123, Email: placeholder@email.com", 10, 100, 2, 1, false, "Porsche 911", "Used", "Full Porsche Hatfield service history, 40.670 miles.", "Ipfs Image Hash Placeholder");
    // Master smart contract deployed for the main E-Auction application
    deployer.deploy(AuctionListing);
};