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

    // Firstly deploy AuctionListing contract - using the default gas price and fee values in Truffle console (otherwise base fee exceeds gas limit)
    contract = await new web3Provider.eth.Contract(abi).deploy({ data: bytecode }).send({ from: userAccount, gas: 4712388, gasPrice: 100000000000 });

    const setAuctionDuration = 24;
    const setAuctionSellingPrice = 10;
    const setAuctionBidIncrement = 2;
    const setAuctionStartingBid = 1;
    // const setAuctionTypeIsPrivate = false;
    const setItemName = "Item Name";
    const setItemDescription = "Item Description";
    const setItemCondition = "Item Condition";
    const setIpfsImageHash = "Item Image Ipfs Hash";

    // Then create a single public Auction with its id being 0 (as listing is zero-based for its index)
    contract.methods.createAuction(setAuctionDuration, setAuctionSellingPrice, setAuctionBidIncrement, setAuctionStartingBid, false, setItemName, setItemDescription, setItemCondition, setIpfsImageHash).send({ from: userAccount, gas: 4712388, gasPrice: 100000000000 });
    // Likewise, create a single private Auction with its id being 1
    contract.methods.createAuction(setAuctionDuration, setAuctionSellingPrice, setAuctionBidIncrement, setAuctionStartingBid, true, setItemName, setItemDescription, setItemCondition, setIpfsImageHash).send({ from: userAccount, gas: 4712388, gasPrice: 100000000000 });
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
        assert.equal(returnedUserWalletBalance < 100, true, "User Account Balance should contain less than default 100 Ether (as contract is deployed).");
    })
});

describe('Get Contract Owner', () => {
    it('check owner exists and is matching', async () => {
        const returnedOwner = await contract.methods.getOwner(id).call();
        assert.equal(userAccount, returnedOwner, "User Account should match.");
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
        assert.equal(returnedAuctionStatus, 1, "Initial Auction status should be equal to 0.");
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

describe('Simulate Transactional Bid', () => {
    it('place bid using new account', async () => {
        const bidder = userAddresses[1];
        // Bid 3 Ether
        const bidValue = '3';
        await contract.methods.placeBid(id).send({ from: bidder, value: web3Provider.utils.toWei(bidValue, 'ether'), gas: 4712388, gasPrice: 100000000000 });

        const returnedUserCurrentBid = web3Provider.utils.fromWei(await contract.methods.getUserCurrentBid(id, bidder).call(), 'ether');
        assert.equal(returnedUserCurrentBid, 3, "User current bid should be greater than 0.");
    })
});

describe('Owner should not be able to bid in their own Auction', () => {
    it('place bid using owner account', async () => {
        // Bid 3 Ether
        const bidValue = '3';
        await contract.methods.placeBid(id).send({ from: userAccount, value: web3Provider.utils.toWei(bidValue, 'ether'), gas: 4712388, gasPrice: 100000000000 }).then(async (response) => {
            if (response) {
                throw null;
            };
        }).catch((error) => {
            assert(error.message.startsWith("VM Exception while processing transaction: revert"), "Expected revert error message");
        });
    });
});

describe('New bid must be greater than previous bid', () => {
    it('place new bid with the same value as previously (PRIVATE)', async () => {
        const bidder = userAddresses[2];
        const privateId = 1;
        // Bid 3 Ether
        const bidValue = '3';
        // First bid
        await contract.methods.placeBid(privateId).send({ from: bidder, value: web3Provider.utils.toWei(bidValue, 'ether'), gas: 4712388, gasPrice: 100000000000 });
        // Second bid with same value
        await contract.methods.placeBid(privateId).send({ from: bidder, value: web3Provider.utils.toWei(bidValue, 'ether'), gas: 4712388, gasPrice: 100000000000 }).then(async (response) => {
            if (response) {
                throw null;
            };
        }).catch((error) => {
            assert(error.message.startsWith("VM Exception while processing transaction: revert"), "Expected revert error message");
        });
    });

    it('place new bid with the same value as previously (PUBLIC)', async () => {
        const bidder = userAddresses[1];
        // Bid 3 Ether
        const bidValue = '3';
        // First bid
        await contract.methods.placeBid(id).send({ from: bidder, value: web3Provider.utils.toWei(bidValue, 'ether'), gas: 4712388, gasPrice: 100000000000 });
        // Second bid with same value
        await contract.methods.placeBid(id).send({ from: bidder, value: web3Provider.utils.toWei(bidValue, 'ether'), gas: 4712388, gasPrice: 100000000000 }).then(async (response) => {
            if (response) {
                throw null;
            };
        }).catch((error) => {
            assert(error.message.startsWith("VM Exception while processing transaction: revert"), "Expected revert error message");
        });
    });
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
    });

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

    });
});

describe('Verify conditional bid increment on Bidding', () => {
    it('new bid must be greater or equal to current bid and bid increment (PRIVATE)', async () => {
        const bidder1 = userAddresses[1];
        const privateId = 1;
        
        await contract.methods.placeBid(privateId).send({ from: bidder1, value: web3Provider.utils.toWei('2', 'ether'), gas: 4712388, gasPrice: 100000000000 });
        // Bid must be greater or equal to 2 + 2
        await contract.methods.placeBid(privateId).send({ from: bidder1, value: web3Provider.utils.toWei('1', 'ether'), gas: 4712388, gasPrice: 100000000000 }).then(async (response) => {
            if (response) {
                throw null;
            };
        }).catch((error) => {
            assert(error.message.startsWith("VM Exception while processing transaction: revert"), "Expected revert error message");
        });
    });

    it('new bid must be greater or equal to highest bid and bid increment (PUBLIC)', async () => {
        const bidder1 = userAddresses[1];
        const bidder2 = userAddresses[2];
     
        await contract.methods.placeBid(id).send({ from: bidder1, value: web3Provider.utils.toWei('2', 'ether'), gas: 4712388, gasPrice: 100000000000 });
        // Bid must be greater or equal to 2 + 2
        await contract.methods.placeBid(id).send({ from: bidder2, value: web3Provider.utils.toWei('1', 'ether'), gas: 4712388, gasPrice: 100000000000 }).then(async (response) => {
            if (response) {
                throw null;
            };
        }).catch((error) => {
            assert(error.message.startsWith("VM Exception while processing transaction: revert"), "Expected revert error message");
        });
    });
});






// TO-DO: SIMULATE USER-BIDDING TRANSACTIONS
