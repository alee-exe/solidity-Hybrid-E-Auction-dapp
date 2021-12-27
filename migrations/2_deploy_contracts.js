var Auction = artifacts.require("./Auction.sol");
var AuctionListing = artifacts.require("./AuctionListing.sol");


module.exports = function(deployer) {
    // MUST CHANGE OWNER CONTRACT ADDRESS EVERY MIGRATION!!!
    // deployer.deploy(Auction, 1, "0x3d6f78575b3E70a45dC7ddb1fd89F12C7b0E7ed8", "Porsche 911", "Used", "Full Porsche Hatfield service history, 40.670 miles.");
    deployer.deploy(AuctionListing);
};