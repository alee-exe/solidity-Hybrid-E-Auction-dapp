const { assert } = require('chai');
// Ganache cli replaces MetaMask in this instance
const ganache = require('ganache-cli');
const web3 = require('web3');
const web3Provider = new web3(ganache.provider());
const AuctionListing = require('../client/build/contracts/AuctionListing.json');

let userAddresses = null;
let userAccount = null;
let contract = null;
let id = 0;

const abi = AuctionListing['abi'];
const bytecode = AuctionListing['bytecode'];

beforeEach(async () => {
    // Fetch generate user account using ganache-cli
    userAddresses = await web3Provider.eth.getAccounts();
    userAccount = userAddresses[0];

    // Firstly deploy the AuctionListing contract - using the default gas price and fee values in Truffle console (otherwise base fee exceeds gas limit)
    contract = await new web3Provider.eth.Contract(abi).deploy({ data: bytecode }).send({ from: userAccount, gas: 5712388, gasPrice: 100000000000 });

    const setOwnerContactDetails = "Contact Details";

    const setAuctionDuration = 24;
    const setAuctionSellingPrice = web3Provider.utils.toWei('10', 'ether');
    const setAuctionBidIncrement = web3Provider.utils.toWei('2', 'ether');
    const setAuctionStartingBid = web3Provider.utils.toWei('1', 'ether');

    const setItemName = "Item Name";
    const setItemDescription = "Item Description";
    const setItemCondition = "Item Condition";
    const setIpfsImageHash = "Item Image Ipfs Hash";

    // Then create a single public Auction with its id being 0 (as listing is zero-based for its index)
    contract.methods.createAuction(setOwnerContactDetails, setAuctionDuration, setAuctionSellingPrice, setAuctionBidIncrement, setAuctionStartingBid, false, setItemName, setItemDescription, setItemCondition, setIpfsImageHash).send({ from: userAccount, gas: 4712388, gasPrice: 100000000000 });
    // Likewise, create a single private Auction with its id being 1
    contract.methods.createAuction(setOwnerContactDetails, setAuctionDuration, setAuctionSellingPrice, setAuctionBidIncrement, setAuctionStartingBid, true, setItemName, setItemDescription, setItemCondition, setIpfsImageHash).send({ from: userAccount, gas: 4712388, gasPrice: 100000000000 });
});

describe('AuctionListing Deployed', () => {
    it('deploys the AuctionListing contract', async () => {
        assert.equal(contract !== null || undefined, true, "Should be deployed to blockchain.");
    })
});

describe('Auction Deployed', () => {
    it('deploys the Auction contract', async () => {
        const returnedListedAuctions = await contract.methods.getListedAuctions().call();
        assert.equal(returnedListedAuctions.length, 2, "Should contain two Auctions in AuctionListing contract.");
    })
});

describe('Smart Contract Paid Gas Fees', () => {
    it('transaction paid for initial and subsequent deployment', async () => {
        const returnedUserWalletBalance = web3Provider.utils.fromWei(await web3Provider.eth.getBalance(userAccount), 'ether');
        assert.equal(returnedUserWalletBalance < 100, true, "User Account Balance should contain less than default 100 Ether (as contract is now deployed).");
    })
});

describe('Get Contract Owner', () => {
    it('check owner exists and is matching', async () => {
        const returnedOwner = await contract.methods.getOwner(id).call();
        assert.equal(returnedOwner, userAccount, "User Account should match.");
    })
});

describe('Get Contract Owner Contact Details', () => {
    it('check owner contact details exists and is matching', async () => {
        const returnedOwnerContactDetails = await contract.methods.getOwnerContactDetails(id).call();
        assert.equal(returnedOwnerContactDetails, "Contact Details", "Owner Contact Details should match.");
    })
});

describe('Get Start Block Timestamp', () => {
    it('check start block timestamp exists and is matching', async () => {
        const returnedStartBlockTimeStamp = await contract.methods.getStartBlockTimeStamp(id).call();
        assert.equal(returnedStartBlockTimeStamp > 0, true, "Start Block Timestamp should be greater than 0.");
    })
});

describe('Get End Block Timestamp', () => {
    it('check end block timestamp exists and is matching', async () => {
        const returnedStartBlockTimeStamp = await contract.methods.getStartBlockTimeStamp(id).call();
        const returnedEndBlockTimeStamp = await contract.methods.getEndBlockTimeStamp(id).call();
        assert.equal(returnedEndBlockTimeStamp > 0 && returnedEndBlockTimeStamp > returnedStartBlockTimeStamp, true, "End Block Timestamp should be greater than 0 & Start Block Timestamp.");
    })
});

describe('Get Auction Type', () => {
    it('check auction type is correct', async () => {
        const returnedAuctionTypeIsPrivate = await contract.methods.getIsPrivate(id).call();
        assert.equal(returnedAuctionTypeIsPrivate, 0, "Auction type should be equal to 0.");
    })
});

describe('Get Starting Bid', () => {
    it('check starting bid exists and is correct', async () => {
        const returnedStartingBid = web3Provider.utils.fromWei(await contract.methods.getStartingBid(id).call(), 'ether');
        assert.equal(returnedStartingBid >= 0, true, "Starting Bid should be greater or equal to 0.");
    })
});

describe('Get Bid Increment', () => {
    it('check bid increment exists and is correct', async () => {
        const returnedBidIncrement = web3Provider.utils.fromWei(await contract.methods.getBidIncrement(id).call(), 'ether');
        assert.equal(returnedBidIncrement >= 0, true, "Bid Increment should be greater or equal to 0.");
    })
});

describe('Get Selling Price', () => {
    it('check selling price exists and is correct', async () => {
        const returnedSellingPrice = web3Provider.utils.fromWei(await contract.methods.getSellingPrice(id).call(), 'ether');
        assert.equal(returnedSellingPrice >= 0, true, "Selling Price should be greater or equal to 0.");
    })
});

describe('Get Auctioned Item', () => {
    it('check auctioned item exists', async () => {
        const returnedAuctionedItem = await contract.methods.getAuctionedItem(id).call();
        assert.equal(returnedAuctionedItem !== null || undefined, true, "Auctioned item should exist.");
    })

    it('check auctioned item name is matching', async () => {
        const returnedAuctionedItem = await contract.methods.getAuctionedItem(id).call();
        const itemName = returnedAuctionedItem[0];
        assert.equal(itemName, "Item Name", "Auctioned item name should match.");
    })

    it('check auctioned item description is matching', async () => {
        const returnedAuctionedItem = await contract.methods.getAuctionedItem(id).call();
        const itemDescription = returnedAuctionedItem[1];
        assert.equal(itemDescription, "Item Description", "Auctioned item description should match.");
    })

    it('check auctioned item condition is matching', async () => {
        const returnedAuctionedItem = await contract.methods.getAuctionedItem(id).call();
        const itemCondition = returnedAuctionedItem[2];
        assert.equal(itemCondition, "Item Condition", "Auctioned item condition should match.");
    })

    it('check auctioned item ipfs image hash is matching', async () => {
        const returnedAuctionedItem = await contract.methods.getAuctionedItem(id).call();
        const ipfsImageHash = returnedAuctionedItem[3];
        assert.equal(ipfsImageHash, "Item Image Ipfs Hash", "Auctioned item ipfs hash should match.");
    })
});


describe('Get Initial Highest Bid', () => {
    it('check inital highest bid value is correct', async () => {
        const returnedHighestBid = web3Provider.utils.fromWei(await contract.methods.getHighestBid(id).call(), 'ether');
        assert.equal(returnedHighestBid, 0, "Inital highest bid should be 0.");
    })
});

describe('Get Initial Highest Bidder', () => {
    it('check inital highest bidder value is correct', async () => {
        const returnedHighestBidder = await contract.methods.getHighestBidder(id).call();
        assert.equal(returnedHighestBidder, 0x0000000000000000000000000000000000000000, "Inital highest bidder should be default address.");
    })
});

describe('Get Initial Auction Status', () => {
    it('check initial auction status is correct', async () => {
        const returnedAuctionStatus = await contract.methods.getAuctionStatus(id).call();
        assert.equal(returnedAuctionStatus, 1, "Initial Auction status should be equal to 1.");
    })
});

describe('Get Initial Auction Purchaser', () => {
    it('check initial auction purchaser is correct', async () => {
        const returnedAuctionPurchaser = await contract.methods.getAuctionPurchaser(id).call();
        assert.equal(returnedAuctionPurchaser, 0x0000000000000000000000000000000000000000, "Inital auction purchaser should be default address.");
    })
});

describe('Get Initial User Current Bid', () => {
    it('check inital user current bid value is correct', async () => {
        const returnedUserCurrentBid = web3Provider.utils.fromWei(await contract.methods.getUserCurrentBid(id, userAccount).call(), 'ether');
        assert.equal(returnedUserCurrentBid, 0, "User current bid value should be equal to 0.");
    })
});

describe('Get Initial Total Number of Bids', () => {
    it('check inital total number of bids value is correct', async () => {
        const returnedTotalNumberOfBids = await contract.methods.getTotalNumberOfBids(id).call();
        assert.equal(returnedTotalNumberOfBids, 0, "Total number of bids should be equal to 0.");
    })
});

describe('Simulate Bid Transaction', () => {
    it('place bid using new account', async () => {
        const bidder = userAddresses[1];
        // Bid 3 Ether
        const bidValue = '3';
        let message = null;

        await contract.methods.placeBid(id).send({ from: bidder, value: web3Provider.utils.toWei(bidValue, 'ether'), gas: 4712388, gasPrice: 100000000000 }).then(async (response) => {
            if (response) {
                message = "success";
            };
        }).catch((error) => {
            if (error) {
                message = "error";
            };
        });

        assert.equal(message, "success", "User placing bid should be successful.");
    })


    it('check the highest bid can be modified and updated', async () => {
        const bidder = userAddresses[1];
        // Bid 3 Ether
        const bidValue = '3';
        await contract.methods.placeBid(id).send({ from: bidder, value: web3Provider.utils.toWei(bidValue, 'ether'), gas: 4712388, gasPrice: 100000000000 });

        const returnedHighestBid = web3Provider.utils.fromWei(await contract.methods.getHighestBid(id).call(), 'ether');
        assert.equal(returnedHighestBid, 3, "Updated highest bid should be greater than 0.");
    })


    it('check the highest bidder can be modified and updated', async () => {
        const bidder = userAddresses[1];
        // Bid 3 Ether
        const bidValue = '3';
        await contract.methods.placeBid(id).send({ from: bidder, value: web3Provider.utils.toWei(bidValue, 'ether'), gas: 4712388, gasPrice: 100000000000 });

        const returnedHighestBidder = await contract.methods.getHighestBidder(id).call();
        assert.equal(returnedHighestBidder !== 0x0000000000000000000000000000000000000000, true, "Updated highest bidder should not be the default address.");
    })


    it('check the user current bid can be modified and updated', async () => {
        const bidder = userAddresses[1];
        // Bid 3 Ether
        const bidValue = '3';
        await contract.methods.placeBid(id).send({ from: bidder, value: web3Provider.utils.toWei(bidValue, 'ether'), gas: 4712388, gasPrice: 100000000000 });

        const returnedUserCurrentBid = web3Provider.utils.fromWei(await contract.methods.getUserCurrentBid(id, bidder).call(), 'ether');
        assert.equal(returnedUserCurrentBid, 3, "Updated user current bid should be greater than 0.");
    })


    it('check the total number of bids can be modified and updated', async () => {
        const bidder = userAddresses[1];
        // Bid 3 Ether
        const bidValue = '3';
        await contract.methods.placeBid(id).send({ from: bidder, value: web3Provider.utils.toWei(bidValue, 'ether'), gas: 4712388, gasPrice: 100000000000 });

        const returnedTotalNumberOfBids = await contract.methods.getTotalNumberOfBids(id).call();
        assert.equal(returnedTotalNumberOfBids, 1, "Updated total number of bids should be equal to 1.");
    })
});

describe('Owner should not be able to bid in their own Auction', () => {
    it('cannot place bid using owner account', async () => {
        // Bid 3 Ether
        const bidValue = '3';
        // Owner attempts to place bid in their own Auction
        await contract.methods.placeBid(id).send({ from: userAccount, value: web3Provider.utils.toWei(bidValue, 'ether'), gas: 4712388, gasPrice: 100000000000 }).then(async (response) => {
            if (response) {
                throw null;
            };
        }).catch((error) => {
            assert(error.message.startsWith("VM Exception while processing transaction: revert"), "Expected revert error message");
        });
    })
});

describe('New bid must be greater than previous bid', () => {
    it('cannot place new bid with the same value as previously (PRIVATE)', async () => {
        const bidder = userAddresses[1];
        const privateId = 1;
        // Bid 3 Ether
        const bidValue = '3';
        // First bid
        await contract.methods.placeBid(privateId).send({ from: bidder, value: web3Provider.utils.toWei(bidValue, 'ether'), gas: 4712388, gasPrice: 100000000000 });
        // Second bid with same value as first bid
        await contract.methods.placeBid(privateId).send({ from: bidder, value: web3Provider.utils.toWei(bidValue, 'ether'), gas: 4712388, gasPrice: 100000000000 }).then(async (response) => {
            if (response) {
                throw null;
            };
        }).catch((error) => {
            assert(error.message.startsWith("VM Exception while processing transaction: revert"), "Expected revert error message");
        });
    })


    it('cannot place new bid with the same value as previously (PUBLIC)', async () => {
        const bidder = userAddresses[1];
        // Bid 3 Ether
        const bidValue = '3';
        // First bid
        await contract.methods.placeBid(id).send({ from: bidder, value: web3Provider.utils.toWei(bidValue, 'ether'), gas: 4712388, gasPrice: 100000000000 });
        // Second bid with same value as first bid
        await contract.methods.placeBid(id).send({ from: bidder, value: web3Provider.utils.toWei(bidValue, 'ether'), gas: 4712388, gasPrice: 100000000000 }).then(async (response) => {
            if (response) {
                throw null;
            };
        }).catch((error) => {
            assert(error.message.startsWith("VM Exception while processing transaction: revert"), "Expected revert error message");
        });
    })
});

describe('Verify conditional Auction Type on Bidding', () => {
    it('new bid can be equal to current highest bid (PRIVATE)', async () => {
        const bidder1 = userAddresses[1];
        const bidder2 = userAddresses[2];
        const privateId = 1;
        // Bid 3 Ether
        const bidValue = '3';
        // First bidder
        await contract.methods.placeBid(privateId).send({ from: bidder1, value: web3Provider.utils.toWei(bidValue, 'ether'), gas: 4712388, gasPrice: 100000000000 });
        // Second bidder
        await contract.methods.placeBid(privateId).send({ from: bidder2, value: web3Provider.utils.toWei(bidValue, 'ether'), gas: 4712388, gasPrice: 100000000000 });

        const returnedUserCurrentBid1 = web3Provider.utils.fromWei(await contract.methods.getUserCurrentBid(privateId, bidder1).call(), 'ether');
        assert.equal(returnedUserCurrentBid1, 3, "User current bid should be greater than 0.");

        const returnedUserCurrentBid2 = web3Provider.utils.fromWei(await contract.methods.getUserCurrentBid(privateId, bidder2).call(), 'ether');
        assert.equal(returnedUserCurrentBid2, 3, "User current bid should be greater than 0.");
    })

    it('bidder may only bid once (Single-round) (PRIVATE)', async () => {
        const bidder1 = userAddresses[1];
        const privateId = 1;
        // Bid 3 Ether
        const bidValue = '3';

        await contract.methods.placeBid(privateId).send({ from: bidder1, value: web3Provider.utils.toWei(bidValue, 'ether'), gas: 4712388, gasPrice: 100000000000 });
        const returnedUserCurrentBid1 = web3Provider.utils.fromWei(await contract.methods.getUserCurrentBid(privateId, bidder1).call(), 'ether');
        assert.equal(returnedUserCurrentBid1, 3, "User current bid should be greater than 0.");

        // Create new valid bid that succeeds previous bid
        const newBidValue = '4';
        // Same bidder attempts to perform new valid bid
        await contract.methods.placeBid(privateId).send({ from: bidder1, value: web3Provider.utils.toWei(newBidValue, 'ether'), gas: 4712388, gasPrice: 100000000000 }).then(async (response) => {
            if (response) {
                throw null;
            };
        }).catch((error) => {
            // Catch revert error as same bidder may only bid once in Private auction
            assert(error.message.startsWith("VM Exception while processing transaction: revert"), "Expected revert error message");
        });
    })

    it('new bid cannot be equal to current highest bid (PUBLIC)', async () => {
        const bidder1 = userAddresses[1];
        const bidder2 = userAddresses[2];
        // Bid 3 Ether
        const bidValue = '3';
        // First bidder
        await contract.methods.placeBid(id).send({ from: bidder1, value: web3Provider.utils.toWei(bidValue, 'ether'), gas: 4712388, gasPrice: 100000000000 });
        // Second bidder
        await contract.methods.placeBid(id).send({ from: bidder2, value: web3Provider.utils.toWei(bidValue, 'ether'), gas: 4712388, gasPrice: 100000000000 }).then(async (response) => {
            if (response) {
                throw null;
            };
        }).catch((error) => {
            assert(error.message.startsWith("VM Exception while processing transaction: revert"), "Expected revert error message");
        });
    })
});

describe('Verify conditional Bid Increment on Bidding', () => {
    it('new bid must be greater or equal to current bid and bid increment (PRIVATE)', async () => {
        const bidder = userAddresses[1];
        const privateId = 1;
        let message = null;

        // Bidder attempts to bid a value less than bid increment
        await contract.methods.placeBid(privateId).send({ from: bidder, value: web3Provider.utils.toWei('1', 'ether'), gas: 4712388, gasPrice: 100000000000 }).then(async (response) => {
            if (response) {
                throw null;
            };
        }).catch((error) => {
            assert(error.message.startsWith("VM Exception while processing transaction: revert"), "Expected revert error message");
        });

        // Bids again with the appropriate values
        await contract.methods.placeBid(privateId).send({ from: bidder, value: web3Provider.utils.toWei('2', 'ether'), gas: 4712388, gasPrice: 100000000000 }).then(async (response) => {
            if (response) {
                message = "success";
            };
        }).catch((error) => {
            if (error) {
                message = "error";
            };
        });

        assert.equal(message, "success", "New bid with appropriate values should be able to be placed.");
        returnedUserCurrentBid = web3Provider.utils.fromWei(await contract.methods.getUserCurrentBid(privateId, bidder).call(), 'ether');
        assert.equal(returnedUserCurrentBid, 2, "User current bid should be greater or equal to bid increment.");
    })


    it('new bid must be greater or equal to highest bid and bid increment (PUBLIC)', async () => {
        const bidder1 = userAddresses[1];
        const bidder2 = userAddresses[2];

        await contract.methods.placeBid(id).send({ from: bidder1, value: web3Provider.utils.toWei('2', 'ether'), gas: 4712388, gasPrice: 100000000000 });
        // New bid must be greater or equal to Highest Current Bid + Bid Increment (2 + 2)
        // Second bidder attempts to bid a lesser value than first bidder
        await contract.methods.placeBid(id).send({ from: bidder2, value: web3Provider.utils.toWei('1', 'ether'), gas: 4712388, gasPrice: 100000000000 }).then(async (response) => {
            if (response) {
                throw null;
            };
        }).catch((error) => {
            assert(error.message.startsWith("VM Exception while processing transaction: revert"), "Expected revert error message");
        });

        // First bidder should have a single bid with a value of 2
        let returnedUserCurrentBid1 = web3Provider.utils.fromWei(await contract.methods.getUserCurrentBid(id, bidder1).call(), 'ether');
        assert.equal(returnedUserCurrentBid1, 2, "User current bid be greater than 0.");
        // Second bidder should have no bids
        let returnedUserCurrentBid2 = web3Provider.utils.fromWei(await contract.methods.getUserCurrentBid(id, bidder2).call(), 'ether');
        assert.equal(returnedUserCurrentBid2, 0, "User current bid should be equal to 0.");

        // Second bidder bids again with the appropriate values
        await contract.methods.placeBid(id).send({ from: bidder2, value: web3Provider.utils.toWei('4', 'ether'), gas: 4712388, gasPrice: 100000000000 }).then(async (response) => {
            if (response) {
                message = "success";
            };
        }).catch((error) => {
            if (error) {
                message = "error";
            };
        });

        assert.equal(message, "success", "New bid with appropriate values should be able to be placed.");
        returnedUserCurrentBid2 = web3Provider.utils.fromWei(await contract.methods.getUserCurrentBid(id, bidder2).call(), 'ether');
        assert.equal(returnedUserCurrentBid2, 4, "User current bid should be greater than 0.");
    })
});

describe('Simulate Auction Cancellation', () => {
    it('Auction status can be set to CANCELLED', async () => {
        let message = null;

        // Owner cancels Auction
        await contract.methods.cancelAuction(id).send({ from: userAccount }).then(async (response) => {
            if (response) {
                message = "success";
            };
        }).catch((error) => {
            if (error) {
                message = "error";
            };
        });

        assert.equal(message, "success", "Auction should be able to be cancelled.");
    })


    it('Auction status cannot change once set to CANCELLED', async () => {
        const bidder = userAddresses[1];

        // Owner cancels Auction
        await contract.methods.cancelAuction(id).send({ from: userAccount });

        // Owner attempts to end Auction
        await contract.methods.endAuction(id).send({ from: userAccount }).then(async (response) => {
            if (response) {
                throw null;
            };
        }).catch((error) => {
            assert(error.message.startsWith("VM Exception while processing transaction: revert"), "Expected revert error message");
        });

        // Bidder attempts to purchase Auction
        await contract.methods.buyAuction(id).send({ from: bidder, value: web3Provider.utils.toWei('10', 'ether'), gas: 4712388, gasPrice: 100000000000 }).then(async (response) => {
            if (response) {
                throw null;
            };
        }).catch((error) => {
            assert(error.message.startsWith("VM Exception while processing transaction: revert"), "Expected revert error message");
        });
    })


    it('check and verify the new modified and updated auction status', async () => {
        let auctionStatus = await contract.methods.getAuctionStatus(id).call();
        assert.equal(auctionStatus, 1, "Auction should be ongoing.");

        // Owner cancels Auction
        await contract.methods.cancelAuction(id).send({ from: userAccount });

        auctionStatus = await contract.methods.getAuctionStatus(id).call();
        assert.equal(auctionStatus, 0, "Auction should now be cancelled.");
    })
});

describe('Simulate Auction Ending', () => {
    it('Auction status can be set to ENDED', async () => {
        let message = null;

        // Owner cancels Auction
        await contract.methods.endAuction(id).send({ from: userAccount }).then(async (response) => {
            if (response) {
                message = "success";
            };
        }).catch((error) => {
            if (error) {
                message = "error";
            };
        });

        assert.equal(message, "success", "Auction should be able to be ended.");
    })


    it('Auction status cannot change once set to ENDED', async () => {
        const bidder = userAddresses[1];

        // Owner ends Auction
        await contract.methods.endAuction(id).send({ from: userAccount });

        // Owner attempts to cancel Auction
        await contract.methods.cancelAuction(id).send({ from: userAccount }).then(async (response) => {
            if (response) {
                throw null;
            };
        }).catch((error) => {
            assert(error.message.startsWith("VM Exception while processing transaction: revert"), "Expected revert error message");
        });

        // Bidder attempts to purchase Auction
        await contract.methods.buyAuction(id).send({ from: bidder, value: web3Provider.utils.toWei('10', 'ether'), gas: 4712388, gasPrice: 100000000000 }).then(async (response) => {
            if (response) {
                throw null;
            };
        }).catch((error) => {
            assert(error.message.startsWith("VM Exception while processing transaction: revert"), "Expected revert error message");
        });
    })


    it('check and verify the new modified and updated auction status', async () => {
        let auctionStatus = await contract.methods.getAuctionStatus(id).call();
        assert.equal(auctionStatus, 1, "Auction should be ongoing.");

        // Owner ends Auction
        await contract.methods.endAuction(id).send({ from: userAccount });

        auctionStatus = await contract.methods.getAuctionStatus(id).call();
        assert.equal(auctionStatus, 2, "Auction should now be ended.");
    })
});

describe('Simulate Auction being Purchased', () => {
    it('Auction status can be set to SOLD', async () => {
        const bidder = userAddresses[1];
        const sellingPrice = '10';
        let message = null;

        // User purchases Auction
        await contract.methods.buyAuction(id).send({ from: bidder, value: web3Provider.utils.toWei(sellingPrice, 'ether'), gas: 4712388, gasPrice: 100000000000 }).then(async (response) => {
            if (response) {
                message = "success";
            };
        }).catch((error) => {
            if (error) {
                message = "error";
            };
        });

        assert.equal(message, "success", "User purchasing Auction should be successful.");
    })


    it('Auction status cannot change once set to SOLD', async () => {
        const bidder = userAddresses[1];
        const sellingPrice = '10';

        // User purchases Auction
        await contract.methods.buyAuction(id).send({ from: bidder, value: web3Provider.utils.toWei(sellingPrice, 'ether'), gas: 4712388, gasPrice: 100000000000 });

        // Owner attempts to cancel Auction
        await contract.methods.cancelAuction(id).send({ from: userAccount }).then(async (response) => {
            if (response) {
                throw null;
            };
        }).catch((error) => {
            assert(error.message.startsWith("VM Exception while processing transaction: revert"), "Expected revert error message");
        });

        // Owner attempts ends Auction
        await contract.methods.endAuction(id).send({ from: userAccount }).then(async (response) => {
            if (response) {
                throw null;
            };
        }).catch((error) => {
            assert(error.message.startsWith("VM Exception while processing transaction: revert"), "Expected revert error message");
        });
    })


    it('bidder cannot purchase Auction for less than set selling price', async () => {
        const bidder = userAddresses[1];
        // Set Selling Price is 10 ETH
        const lessThanSellingPrice = '1';
      
        // User attempts to purchase Auction for less than set selling price
        await contract.methods.buyAuction(id).send({ from: bidder, value: web3Provider.utils.toWei(lessThanSellingPrice, 'ether'), gas: 4712388, gasPrice: 100000000000 }).then(async (response) => {
            if (response) {
                throw null;
            };
        }).catch((error) => {
            assert(error.message.startsWith("VM Exception while processing transaction: revert"), "Expected revert error message");
        });
    })


    it('check and verify the new modified and updated auction status', async () => {
        const bidder = userAddresses[1];
        const sellingPrice = '10';

        let auctionStatus = await contract.methods.getAuctionStatus(id).call();
        assert.equal(auctionStatus, 1, "Auction should be ongoing.");

        // Bidder purchases Auction for 10 ETH (Set Selling Price)
        await contract.methods.buyAuction(id).send({ from: bidder, value: web3Provider.utils.toWei(sellingPrice, 'ether'), gas: 4712388, gasPrice: 100000000000 });
        auctionStatus = await contract.methods.getAuctionStatus(id).call();
        assert.equal(auctionStatus, 3, "Auction should now be bought.");
    })
});

describe('Simulate Withdrawal Transaction', () => {
    it('bids can be withdrawn by bidders after Auction Cancellation', async () => {
        const bidder = userAddresses[1];
        // Bid 5 Ether
        const bidValue = '5';
        let message = null;

        await contract.methods.placeBid(id).send({ from: bidder, value: web3Provider.utils.toWei(bidValue, 'ether'), gas: 4712388, gasPrice: 100000000000 });

        let returnedUserCurrentBid = web3Provider.utils.fromWei(await contract.methods.getUserCurrentBid(id, bidder).call(), 'ether');
        assert.equal(returnedUserCurrentBid, 5, "User current bid should be greater than 0.");

        // Owner cancels Auction
        await contract.methods.cancelAuction(id).send({ from: userAccount });

        // User withdraws their bid
        await contract.methods.withdrawBid(id).send({ from: bidder }).then(async (response) => {
            if (response) {
                message = "success";
            };
        }).catch((error) => {
            if (error) {
                message = "error";
            };
        });

        assert.equal(message, "success", "Bidder should be able to withdraw their own Auction bid.");

        // Highest bidder's bid should now contain 0 ETH (as claim was successful)
        returnedUserCurrentBid = web3Provider.utils.fromWei(await contract.methods.getUserCurrentBid(id, bidder).call(), 'ether');
        assert.equal(returnedUserCurrentBid, 0, "User current bid should now be equal to 0.");
    })


    it('bids can be withdrawn by bidders after Auction Purchase', async () => {
        const bidder1 = userAddresses[1];
        const bidder2 = userAddresses[2];
        // Bid 5 Ether
        const bidValue = '5';
        // Set selling price to 10 Ether
        const sellingPrice = '10';

        let message = null;

        // First user places bid
        await contract.methods.placeBid(id).send({ from: bidder1, value: web3Provider.utils.toWei(bidValue, 'ether'), gas: 4712388, gasPrice: 100000000000 });

        let returnedUserCurrentBid = web3Provider.utils.fromWei(await contract.methods.getUserCurrentBid(id, bidder1).call(), 'ether');
        assert.equal(returnedUserCurrentBid, 5, "User current bid should be greater than 0.");

        // Second user purchases Auction
        await contract.methods.buyAuction(id).send({ from: bidder2, value: web3Provider.utils.toWei(sellingPrice, 'ether'), gas: 4712388, gasPrice: 100000000000 });

        // First user withdraws their bid
        await contract.methods.withdrawBid(id).send({ from: bidder1 }).then(async (response) => {
            if (response) {
                message = "success";
            };
        }).catch((error) => {
            if (error) {
                message = "error";
            };
        });

        assert.equal(message, "success", "Bidder should be able to withdraw their own Auction bid.");

        // Highest bidder's bid should now contain 0 ETH (as claim was successful)
        returnedUserCurrentBid = web3Provider.utils.fromWei(await contract.methods.getUserCurrentBid(id, bidder1).call(), 'ether');
        assert.equal(returnedUserCurrentBid, 0, "User current bid should now be equal to 0.");
    })


    it('bids cannot be withdrawn by bidders when Auction is Ongoing', async () => {
        const bidder = userAddresses[1];
        // Bid 5 Ether - user is highest bidder
        const bidValue = '5';
        await contract.methods.placeBid(id).send({ from: bidder, value: web3Provider.utils.toWei(bidValue, 'ether'), gas: 4712388, gasPrice: 100000000000 });

        let returnedUserCurrentBid = web3Provider.utils.fromWei(await contract.methods.getUserCurrentBid(id, bidder).call(), 'ether');
        assert.equal(returnedUserCurrentBid, 5, "User current bid should be greater than 0.");

        // Bidder attempts to withdraw their bid
        await contract.methods.withdrawBid(id).send({ from: bidder }).then(async (response) => {
            if (response) {
                throw null;
            };
        }).catch((error) => {
            assert(error.message.startsWith("VM Exception while processing transaction: revert"), "Expected revert error message");
        });

        // Highest bidder's bid should remain the same (as withdrawal was unsuccessful)
        returnedUserCurrentBid = web3Provider.utils.fromWei(await contract.methods.getUserCurrentBid(id, bidder).call(), 'ether');
        assert.equal(returnedUserCurrentBid, 5, "User current bid should remain the same as before.");
    })


    it('highest bid cannot be withdrawn from highest bidder in Ended Auctions', async () => {
        const bidder = userAddresses[1];
        // Bid 5 Ether - user is highest bidder
        const bidValue = '5';
        await contract.methods.placeBid(id).send({ from: bidder, value: web3Provider.utils.toWei(bidValue, 'ether'), gas: 4712388, gasPrice: 100000000000 });

        let returnedUserCurrentBid = web3Provider.utils.fromWei(await contract.methods.getUserCurrentBid(id, bidder).call(), 'ether');
        assert.equal(returnedUserCurrentBid, 5, "User current bid should be greater than 0.");

        // Owner ends Auction
        await contract.methods.endAuction(id).send({ from: userAccount });
        // Bidder attempts to withdraw their bid
        await contract.methods.withdrawBid(id).send({ from: bidder }).then(async (response) => {
            if (response) {
                throw null;
            };
        }).catch((error) => {
            assert(error.message.startsWith("VM Exception while processing transaction: revert"), "Expected revert error message");
        });

        // Highest bidder's bid should remain the same (as withdrawal was unsuccessful)
        returnedUserCurrentBid = web3Provider.utils.fromWei(await contract.methods.getUserCurrentBid(id, bidder).call(), 'ether');
        assert.equal(returnedUserCurrentBid, 5, "User current bid should remain the same as before.");
    })
});

describe('Simulate Owner Claiming Winning Bid', () => {
    it('owner can claim highest bid after Auction Ended', async () => {
        const bidder = userAddresses[1];
        // Bidder bids 5 Ether
        const bidValue = '5';
        let message = null;

        await contract.methods.placeBid(id).send({ from: bidder, value: web3Provider.utils.toWei(bidValue, 'ether'), gas: 4712388, gasPrice: 100000000000 });

        let returnedUserCurrentBid = web3Provider.utils.fromWei(await contract.methods.getUserCurrentBid(id, bidder).call(), 'ether');
        assert.equal(returnedUserCurrentBid, 5, "User current bid should be greater than 0.");

        // Owner ends Auction
        await contract.methods.endAuction(id).send({ from: userAccount });

        auctionStatus = await contract.methods.getAuctionStatus(id).call();
        assert.equal(auctionStatus, 2, "Auction should now be ended.");

        // Owner claims the winning bid
        await contract.methods.claimWinningBid(id).send({ from: userAccount }).then(async (response) => {
            if (response) {
                message = "success";
            };
        }).catch((error) => {
            if (error) {
                message = "error";
            };
        });

        assert.equal(message, "success", "Auction's highest bid should be able to be claimed by owner.");

        // Highest bidder's bid should now contain 0 ETH (as claim was successful)
        returnedUserCurrentBid = web3Provider.utils.fromWei(await contract.methods.getUserCurrentBid(id, bidder).call(), 'ether');
        assert.equal(returnedUserCurrentBid, 0, "Highest bidder bid should be equal to 0.");
    })


    it('only owner can claim the winning bid after Auction Ended', async () => {
        const bidder = userAddresses[1];
        // Bidder bids 5 Ether
        const bidValue = '5';

        await contract.methods.placeBid(id).send({ from: bidder, value: web3Provider.utils.toWei(bidValue, 'ether'), gas: 4712388, gasPrice: 100000000000 });

        let returnedUserCurrentBid = web3Provider.utils.fromWei(await contract.methods.getUserCurrentBid(id, bidder).call(), 'ether');
        assert.equal(returnedUserCurrentBid, 5, "User current bid should be greater than 0.");

        // Bidder attempts to claim the winning bid
        await contract.methods.claimWinningBid(id).send({ from: bidder }).then(async (response) => {
            if (response) {
                throw null;
            };
        }).catch((error) => {
            assert(error.message.startsWith("VM Exception while processing transaction: revert"), "Expected revert error message");
        });

        // Highest bidder's bid should remain the same (as claim was unsuccessful)
        returnedUserCurrentBid = web3Provider.utils.fromWei(await contract.methods.getUserCurrentBid(id, bidder).call(), 'ether');
        assert.equal(returnedUserCurrentBid, 5, "User current bid should remain the same as before.");
    })


    it('owner cannot claim highest bid when Auction is not Ended', async () => {
        const bidder = userAddresses[1];
        // Bidder bids 5 Ether
        const bidValue = '5';

        await contract.methods.placeBid(id).send({ from: bidder, value: web3Provider.utils.toWei(bidValue, 'ether'), gas: 4712388, gasPrice: 100000000000 });

        let returnedUserCurrentBid = web3Provider.utils.fromWei(await contract.methods.getUserCurrentBid(id, bidder).call(), 'ether');
        assert.equal(returnedUserCurrentBid, 5, "User current bid should be greater than 0.");

        // Owner attempts to claim the winning bid
        await contract.methods.claimWinningBid(id).send({ from: userAccount }).then(async (response) => {
            if (response) {
                throw null;
            };
        }).catch((error) => {
            assert(error.message.startsWith("VM Exception while processing transaction: revert"), "Expected revert error message");
        });

        // Highest bidder's bid should remain the same (as claim was unsuccessful)
        returnedUserCurrentBid = web3Provider.utils.fromWei(await contract.methods.getUserCurrentBid(id, bidder).call(), 'ether');
        assert.equal(returnedUserCurrentBid, 5, "User current bid should remain the same as before.");
    })
});