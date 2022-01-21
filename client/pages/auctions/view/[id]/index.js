import { Component, useState } from 'react';
import { withRouter, NextRouter } from 'next/router';
import Image from 'next/image';
import getWeb3 from '@/components/getWeb3.js';
import AuctionListing from '@/build/contracts/AuctionListing.json';
import Auction from '@/build/contracts/Auction.json';
import Alert from '@/components/Alert.js';
import Tooltip from '@/components/Tooltip.js';
import LoadingImage from '@/components/images/loading-bar.gif';
import { convertTimestampToDate, enumStatus, checkAuctionType } from '@/components/AuctionUtils.js';
import axios from "axios";


export default withRouter(class Home extends Component {

    state = {
        web3Provider: null,
        userAccount: null,
        userCurrentBid: null,
        contract: null,
        auctionContract: null,
        auctionAddress: null,
        owner: null,
        startingBid: null,
        bidIncrement: null,
        sellingPrice: null,
        auctionIsPrivate: null,
        itemName: null,
        itemCondition: null,
        itemDescription: null,
        ipfsImageHash: null,
        startBlockTimeStamp: null,
        endBlockTimeStamp: null,
        highestBidder: null,
        highestBid: null,
        totalNumberOfBids: null,
        auctionStatus: null,
        auctionTimer: null,
        auctionId: null,
        bidAlert: null,
        bidValue: null,
        bidEventLog: null,
        ETHtoFiatCurrency: "GBP",
        ETHtoFiatConversion: null
    };

    componentDidMount = async () => {

        try {
            const web3 = await getWeb3();
            const blockchainNetworkId = await web3.eth.net.getId();
            const contractAddress = await AuctionListing.networks[blockchainNetworkId].address;
            const contract = new web3.eth.Contract(AuctionListing['abi'], contractAddress);
            const userAddresses = await web3.eth.getAccounts();
            const userAccount = userAddresses[0];
            //web3.eth.defaultAccount = userAccount;

            const id = this.props.router.query.id - 1;

            const listedAuctions = await contract.methods.getListedAuctions().call();
            const auctionAddress = listedAuctions[id];
            const auctionContract = new web3.eth.Contract(Auction['abi'], auctionAddress);

            const owner = await contract.methods.getOwner(id).call();
            const startBlockTimeStamp = await contract.methods.getStartBlockTimeStamp(id).call();
            const endBlockTimeStamp = await contract.methods.getEndBlockTimeStamp(id).call();
            const highestBid = web3.utils.fromWei(await contract.methods.getHighestBid(id).call(), 'ether');
            const highestBidder = await contract.methods.getHighestBidder(id).call();
            const startingBid = web3.utils.fromWei(await contract.methods.getStartingBid(id).call(), 'ether');
            const bidIncrement = web3.utils.fromWei(await contract.methods.getBidIncrement(id).call(), 'ether');
            const sellingPrice = web3.utils.fromWei(await contract.methods.getSellingPrice(id).call(), 'ether');

            const auctionStatus = await contract.methods.getAuctionStatus(id).call();
            const auctionedItem = await contract.methods.getAuctionedItem(id).call();
            const auctionTimer = (endBlockTimeStamp - Math.floor(Date.now() / 1000));
            const auctionIsPrivate = await contract.methods.getIsPrivate(id).call();

            const itemName = auctionedItem[0];
            const itemDescription = auctionedItem[1];
            const itemCondition = auctionedItem[2];
            const ipfsImageHash = auctionedItem[3];

            const userCurrentBid = web3.utils.fromWei(await contract.methods.getUserCurrentBid(id, userAccount).call(), 'ether');
            const totalNumberOfBids = await contract.methods.getTotalNumberOfBids(id).call();

            this.setState({ web3Provider: web3, contract, auctionContract, auctionAddress, userAccount, userCurrentBid, totalNumberOfBids, owner, startingBid, bidIncrement, sellingPrice, auctionIsPrivate, itemName, itemCondition, itemDescription, ipfsImageHash, startBlockTimeStamp, endBlockTimeStamp, highestBidder, highestBid, auctionStatus, auctionTimer, auctionId: id });

            this.intervalAuctionTimer = setInterval(() => this.setState({ auctionTimer: endBlockTimeStamp - Math.floor(Date.now() / 1000) }), 1000);

            this.intervalAuctionStatus = setInterval(() => {
                if (this.state.auctionTimer <= 0 || this.state.auctionStatus == 1) {
                    this.updateAuctionStatus();
                };
            }, 10000);

            this.intervalHighestBidder = setInterval(() => {
                this.updateHighestBidder();
                this.updateHighestBid();
            }, 3000);

            this.intervalUserCurrentBid = setInterval(() => {
                this.updateUserCurrentBid();
                this.updateNumberOfTotalBids();
            }, 1000);

        } catch (error) {
            console.log(error);
        };
    }

    // Clear auction timer, status, highest bid, and bidder check to prevent memory leaks
    componentWillUnmount() {
        clearInterval(this.intervalAuctionTimer);
        clearInterval(this.intervalAuctionStatus);
        clearInterval(this.intervalHighestBidder);
        clearInterval(this.intervalUserCurrentBid);
    }

    updateAuctionStatus = async () => {
        const { contract, auctionId, userAccount } = this.state;
        // Check if auction has ended
        if ((this.state.endBlockTimeStamp - Math.floor(Date.now() / 1000)) <= 0 && this.state.auctionStatus == 1) {
            console.log("AUCTION HAS ENDED");

            // User must accept the new state
            const auctionStatusEnded = await contract.methods.endAuction(auctionId).send({ from: userAccount });
            this.setState({ auctionStatus: auctionStatusEnded });
        };

        // Check if auction has been cancelled or ended
        const auctionStatusCheck = await contract.methods.getAuctionStatus(auctionId).call();
        if (auctionStatusCheck != this.state.auctionStatus) {
            this.setState({ auctionStatus: auctionStatusCheck });
        };
    }

    updateHighestBidder = async () => {
        const { contract, auctionId } = this.state;
        const newHighestBidder = await contract.methods.getHighestBidder(auctionId).call();

        if ((newHighestBidder !== this.state.highestBidder)) {
            this.setState({ highestBidder: newHighestBidder });
        };
    }

    updateHighestBid = async () => {
        const { contract, auctionId, web3Provider } = this.state;
        const newHighestBid = web3Provider.utils.fromWei(await contract.methods.getHighestBid(auctionId).call(), 'ether');

        if ((newHighestBid !== this.state.highestBid)) {
            this.setState({ highestBid: newHighestBid });
        };
    }

    updateUserCurrentBid = async () => {
        const { contract, auctionId, userAccount, web3Provider } = this.state;
        const newUserCurrentBid = web3Provider.utils.fromWei(await contract.methods.getUserCurrentBid(auctionId, userAccount).call(), 'ether');

        if ((newUserCurrentBid !== this.state.userCurrentBid)) {
            this.setState({ userCurrentBid: newUserCurrentBid });
        };
    }

    updateNumberOfTotalBids = async () => {
        const { contract, auctionId } = this.state;
        const newTotalNumberOfBids = await contract.methods.getTotalNumberOfBids(auctionId).call();

        if ((newTotalNumberOfBids !== this.state.totalNumberOfBids)) {
            this.setState({ totalNumberOfBids: newTotalNumberOfBids });
        };
    }

    // event prevent default to allow user to accept MetaMask transaction
    onClickPlaceBid = async (event) => {
        event.preventDefault();
        const { contract, web3Provider, userAccount, bidValue, auctionId } = this.state;

        await contract.methods.placeBid(auctionId).send({ from: userAccount, value: web3Provider.utils.toWei(bidValue, 'ether'), gas: 200000 }).then(async (response) => {
            if (response) {
                const bidAlert = <Alert type="success">Successfully placed Bid!</Alert>;
                this.setState({ bidAlert });
                this.onLogBidEvent();
            };
        }).catch((error) => {
            if (error) {
                const bidAlert = <Alert type="danger">Error: Could not place Bid. See console for more details.</Alert>;
                this.setState({ bidAlert });
            };
        });
    }

    onLogBidEvent = async () => {
        const { auctionContract, web3Provider, auctionIsPrivate } = this.state;
        console.log("Registered user bid event.");

        await auctionContract.events.bidEvent({ fromBlock: 'latest' })
            .on("error", (error) => {
                console.log(error);
            })
            .on("data", async (event) => {
                console.log("Creating bid event log message.");
                const userAddress = event.returnValues[0];
                const bidAmount = web3Provider.utils.fromWei(event.returnValues[1], 'ether');
                const transactionHash = event['transactionHash'];
                // const auctionAddress = event['address'];
                let bidEventLog = null;

                if (this.state.auctionIsPrivate) {
                    // If private hide bidding amount
                    bidEventLog = "<span class='font-bold'>New Bid from User Address: </span>" + userAddress + ". <br> <span class='font-bold'>Transaction (TX) Hash at: </span>" + transactionHash + " on " + convertTimestampToDate(Math.floor(Date.now() / 1000)) + ".";
                } else {
                    bidEventLog = "<span class='font-bold'>New Bid from User Address: </span>" + userAddress + " at " + bidAmount + " ETH. <br> <span class='font-bold'>Transaction (TX) Hash at: </span>" + transactionHash + " on " + convertTimestampToDate(Math.floor(Date.now() / 1000)) + ".";
                }

                // Prevent duplicate logs
                if (this.state.bidEventLog !== bidEventLog) {
                    console.log("Detected new bid log event message.");
                    // let eventMessage = document.createElement("p");
                    // eventMessage.innerText = bidEventLog;
                    // let horizontalRuler = document.createElement("hr");
                    // document.getElementById("auctionEventLogs").append(eventMessage);
                    // document.getElementById("auctionEventLogs").append(horizontalRuler);

                    document.getElementById("singleAuctionEventLog").innerHTML = bidEventLog;

                    this.setState({ bidEventLog });
                };
            });
    }

    handleBidValue = (event) => {
        this.setState({ bidValue: event.target.value });
        this.fetchETHtoFiatCurrency();
    }

    onClickWithdraw = async (event) => {
        event.preventDefault();
        const { contract, userAccount, auctionId } = this.state;

        await contract.methods.withdrawBid(auctionId).send({ from: userAccount }).then(async (response) => {
            if (response) {
                const bidAlert = <Alert type="success">Successfully withdrawn!</Alert>;
                this.setState({ bidAlert });
                this.onLogWithdrawEvent();
            };
        }).catch((error) => {
            if (error) {
                const bidAlert = <Alert type="danger">Error: Could not withdraw. See console for more details.</Alert>;
                this.setState({ bidAlert });
            };
        });
    }

    onLogWithdrawEvent = async () => {
        const { auctionContract } = this.state;
        console.log("Registered user withdraw event.");

        await auctionContract.events.withdrawalEvent({ fromBlock: 'latest' })
            .on("error", (error) => {
                console.log(error);
            })
            .on("data", async (event) => {
                console.log("Creating user withdraw event message.");
                console.log(event);

                const userAddress = event.returnValues[0];
                const transactionHash = event['transactionHash'];
                const withdrawEventLog = "<span class='font-bold'>User: </span>" + userAddress + " has withdrawn from the Auction. <span class='font-bold'>Transaction (TX) Hash at: </span>" + transactionHash + ".";

                document.getElementById("singleAuctionEventLog").innerHTML = withdrawEventLog;
            });
    }

    onClickCancel = async (event) => {
        event.preventDefault();
        const { contract, userAccount, auctionId } = this.state;

        await contract.methods.cancelAuction(auctionId).send({ from: userAccount }).then(async (response) => {
            if (response) {
                const bidAlert = <Alert type="success">Successfully cancelled this Auction.</Alert>;
                this.setState({ bidAlert });
                this.onLogCancelEvent();
            };
        }).catch((error) => {
            if (error) {
                const bidAlert = <Alert type="danger">Error: Could not cancel auction. See console for more details.</Alert>;
                this.setState({ bidAlert });
            };
        });
    }

    onLogCancelEvent = async () => {
        const { auctionContract } = this.state;
        console.log("Registered owner cancel event.");

        await auctionContract.events.statusEvent({ fromBlock: 'latest' })
            .on("error", (error) => {
                console.log(error);
            })
            .on("data", async (event) => {
                console.log("Creating owner event cancel message.");
                console.log(event);

                const userAddress = event.returnValues[0];
                const transactionHash = event['transactionHash'];
                const cancelEventLog = "<span class='font-bold'>Owner: </span>" + userAddress + " has cancelled the Auction. <span class='font-bold'>Transaction (TX) Hash at: </span>" + transactionHash + ".";

                document.getElementById("singleAuctionEventLog").innerHTML = cancelEventLog;
            });
    }

    onClickClaimWinningBid = async (event) => {
        event.preventDefault();
        const { contract, userAccount, auctionId } = this.state;

        await contract.methods.claimWinningBid(auctionId).send({ from: userAccount }).then(async (response) => {
            if (response) {
                const bidAlert = <Alert type="success">Successfully claimed the winning bid!</Alert>;
                this.setState({ bidAlert });
                this.onLogCancelEvent();
            };
        }).catch((error) => {
            if (error) {
                const bidAlert = <Alert type="danger">Error: Could not claim the winning bid. See console for more details.</Alert>;
                this.setState({ bidAlert });
            };
        });

    }

    // Fetches the price of 1 ETH to Fiat currencies
    fetchETHtoFiatCurrency = async () => {
        const { data } = await axios.get(`https://min-api.cryptocompare.com/data/price?fsym=ETH&tsyms=USD,EUR,GBP`);
        const { ETHtoFiatCurrency, bidValue, web3Provider } = this.state;

        if (bidValue === null) {
            bidValue = 0;
        }

        const ETHtoFiatConversion = (data[ETHtoFiatCurrency] * bidValue).toFixed(2);
        this.setState({ ETHtoFiatConversion });
    }

    handleFiatCurrency = (event) => {
        this.setState({ ETHtoFiatCurrency: event.target.value });
        this.fetchETHtoFiatCurrency();
    }


    render() {

        // If Auction is Private view - hide specific bidding information
        if (this.state.auctionIsPrivate === true) {
            return (<div>
                {this.state.bidAlert}
                <div className="flex mt-4 card border">
                    <div className="row-span-3 pl-5 pt-5">
                        {this.state.ipfsImageHash === null ? (<Image src={LoadingImage} width={670} height={440} priority={true}></Image>) : (<Image src={`https://ipfs.infura.io/ipfs/${this.state.ipfsImageHash}`} width={670} height={440} priority={true}></Image>)}
                    </div>

                    <div className="row-span-2 col-span-2 pt-5 ml-10 leading-4">
                        <h1 className="font-bold text-3xl pb-3">{this.state.itemName}</h1>
                        <hr className="pb-4 border-slate-400" />
                        <p className="font-bold italic text-lg">The owner has described/noted this item as:</p>
                        <p className="text-lg pb-3">"{this.state.itemDescription}"</p>
                        <p className="font-bold italic text-lg">The item's condition is as follows:</p>
                        <p className="text-lg pb-3">"{this.state.itemCondition}"</p>

                        <p className="pb-3"><span className="font-bold"> Auction Owner (Address): </span>{this.state.owner}</p>
                        <p className="pb-3"><span className="font-bold">Auction Contract (Address): </span>{this.state.auctionAddress}</p>
                        <p className="pb-3"><span className="font-bold">Auction End Date: </span>{convertTimestampToDate(this.state.endBlockTimeStamp)} (remaining time: {this.state.auctionStatus == 0 ? ("CANCELLED") : (convertTimestampToDate(this.state.auctionTimer, "time"))})</p>

                        <p className="pb-3"><span className="font-bold">Auction Status: </span>{enumStatus(this.state.auctionStatus)}</p>
                        <p className="pb-3"><span className="font-bold">Auction Type: </span>{checkAuctionType(this.state.auctionIsPrivate)}</p>

                        {this.state.startingBid == 0 ? null : (<p className="pb-3"><span className="font-bold">Starting Bid: </span>{this.state.startingBid} ETH</p>)}
                        {this.state.bidIncrement == 0 ? null : (<p className="pb-3"><span className="font-bold">Bid Increment: </span>{this.state.bidIncrement} ETH</p>)}
                        {this.state.sellingPrice == 0 ? null : (<p className="pb-3"><span className="font-bold">Selling Price: </span>{this.state.sellingPrice} ETH</p>)}

                        <p className="pb-3"><span className="font-bold">Created on: </span>{convertTimestampToDate(this.state.startBlockTimeStamp)}.</p>
                    </div>
                </div>

                <div className="flex">
                    <div className="mt-4 card border w-1/2 mr-4">
                        <p className="mb-2 text-lg">Auction Bids</p>
                        <hr className="pb-4 border-slate-400" />
                        {/* <p><span className="font-bold">Current Highest Bidder (Address): </span>{this.state.highestBidder}</p>
                        <p><span className="font-bold">Current Highest Bid: </span>{this.state.highestBid} ETH</p> */}
                        <p><span className="font-bold">Your Current Bid: </span>{this.state.userCurrentBid} ETH</p>

                        <p className="mt-2"><span className="font-bold">Total Number of Bids in this Auction: </span>{this.state.totalNumberOfBids}</p>
                    </div>

                    <div className="mt-4 flex card border w-1/2">
                        <div className="w-1/2">
                            <div className="mb-4 flex">Enter your Bid Value (Converts from Wei to ETH): <Tooltip header="Place Bid" message="Enter your bid value using the input below. Place and finalised your bid by clicking the blue button and accepting the MetaMask transaction. See your current bid value to market fiat currency using the green dropdown menu. NOTE: Bid values do not account for required gas fees." ></Tooltip></div>
                            <form onSubmit={this.onClickPlaceBid} className="flex">
                                {this.state.bidIncrement == 0 ? (<input type="number" min="0" step="any" placeholder="Insert ETH Amount" className="pt-2 border rounded p-2" onChange={this.handleBidValue} required />) : (<input type="number" min="0" step={this.state.bidIncrement} placeholder="Insert ETH Amount" className="pt-2 border rounded p-2" onChange={this.handleBidValue} required />)}
                                <button type="submit" id="bid" className="font-bold bg-blue-500 text-white rounded p-4 shadow-lg">
                                    Place Bid
                                </button>
                            </form>

                            <div className="mt-3">
                                {this.state.bidValue === null ? (<p className="italic">Enter bid value to convert to Fiat Currency...</p>) : (<div className="italic flex"><p className="mr-2">This is equivalent to... {this.state.ETHtoFiatConversion} {this.state.ETHtoFiatCurrency}</p> <Tooltip header="ETH to Fiat Conversion" message="This price conversion is done using the latest market price for ETH from https://www.cryptocompare.com/." ></Tooltip></div>)}
                            </div>
                        </div>

                        <select id="fiat" className="bg-emerald-600 rounded-r-lg text-white shadow-lg font-bold" onChange={this.handleFiatCurrency}>
                            <option value="GBP" selected="selected">GBP</option>
                            <option value="EUR">EUR</option>
                            <option value="USD">USD</option>
                        </select>

                        <div className="w-1/2 pl-10">
                            <div className="mb-4 flex"><p className="mr-1">Withdraw from Auction: </p><Tooltip header="Withdrawal of Bid" message="You can only withdraw once the Auction has expired (Ended or Cancelled status)." ></Tooltip></div>
                            {this.state.auctionStatus != 1 ? <button className="font-bold bg-slate-500 text-white rounded p-4 shadow-lg w-4/5" id="withdraw" onClick={this.onClickWithdraw} type="button">Withdraw
                                bids</button> : <button className="font-bold bg-slate-500 text-white rounded p-4 shadow-lg w-4/5 opacity-50 cursor-not-allowed" disabled id="withdraw" onClick={this.onClickWithdraw} type="button">Withdraw
                                    bids</button>}
                        </div>
                    </div>
                </div>

                <div className="flex">
                    <div id="auctionEventLogs" className="mt-4 card border w-8/12 mr-4">
                        <p className="mb-2 text-lg">Auction Event Logs</p>
                        <hr className="pb-4 border-slate-400" />
                        <p id="singleAuctionEventLog"></p>
                    </div>

                    <div id="auctionOwnerOperations" className="mt-4 card border w-4/12">
                        <div className="mb-2 text-lg flex"><p className="mr-1">Auction Owner Operations</p><Tooltip header="Auction Owner Operations" message="Only the Contract Owner of this Auction can perform these operations." ></Tooltip></div>
                        <hr className="pb-4 border-slate-400" />
                        <div className="flex">
                            {this.state.userAccount === this.state.owner ? <button className="font-bold bg-red-700 text-white rounded p-4 shadow-lg w-1/2 pb-4 mr-4" id="cancel" onClick={this.onClickCancel} type="button">Cancel Auction</button> :
                                <button className="font-bold bg-red-700 text-white rounded p-4 shadow-lg opacity-50 cursor-not-allowed w-1/2 pb-4 mr-4" disabled id="cancel" onClick={this.onClickCancel} type="button">Cancel Auction</button>}
                            {this.state.userAccount === this.state.owner ? <button className="font-bold bg-green-700 text-white rounded p-4 shadow-lg w-1/2" id="claim" onClick={this.onClickClaimWinningBid} type="button">Claim Winnings</button> :
                                <button className="font-bold bg-green-700 text-white rounded p-4 shadow-lg opacity-50 cursor-not-allowed w-1/2" disabled id="claim" onClick={this.onClickClaimWinningBid} type="button">Claim Winnings</button>}
                        </div>
                    </div>
                </div>
            </div>)
        }

        // Else render Public view
        return (
            <div>
                {this.state.bidAlert}
                <div className="flex mt-4 card border">
                    <div className="row-span-3 pl-5 pt-5">
                        {this.state.ipfsImageHash === null ? (<Image src={LoadingImage} width={670} height={440} priority={true}></Image>) : (<Image src={`https://ipfs.infura.io/ipfs/${this.state.ipfsImageHash}`} width={670} height={440} priority={true}></Image>)}
                    </div>

                    <div className="row-span-2 col-span-2 pt-5 ml-10 leading-4">
                        <h1 className="font-bold text-3xl pb-3">{this.state.itemName}</h1>
                        <hr className="pb-4 border-slate-400" />
                        <p className="font-bold italic text-lg">The owner has described/noted this item as:</p>
                        <p className="text-lg pb-3">"{this.state.itemDescription}"</p>
                        <p className="font-bold italic text-lg">The item's condition is as follows:</p>
                        <p className="text-lg pb-3">"{this.state.itemCondition}"</p>

                        <p className="pb-3"><span className="font-bold"> Auction Owner (Address): </span>{this.state.owner}</p>
                        <p className="pb-3"><span className="font-bold">Auction Contract (Address): </span>{this.state.auctionAddress}</p>
                        <p className="pb-3"><span className="font-bold">Auction End Date: </span>{convertTimestampToDate(this.state.endBlockTimeStamp)} (remaining time: {this.state.auctionStatus == 0 ? ("CANCELLED") : (convertTimestampToDate(this.state.auctionTimer, "time"))})</p>

                        <p className="pb-3"><span className="font-bold">Auction Status: </span>{enumStatus(this.state.auctionStatus)}</p>
                        <p className="pb-3"><span className="font-bold">Auction Type: </span>{checkAuctionType(this.state.auctionIsPrivate)}</p>

                        {this.state.startingBid == 0 ? null : (<p className="pb-3"><span className="font-bold">Starting Bid: </span>{this.state.startingBid} ETH</p>)}
                        {this.state.bidIncrement == 0 ? null : (<p className="pb-3"><span className="font-bold">Bid Increment: </span>{this.state.bidIncrement} ETH</p>)}
                        {this.state.sellingPrice == 0 ? null : (<p className="pb-3"><span className="font-bold">Selling Price: </span>{this.state.sellingPrice} ETH</p>)}

                        <p className="pb-3"><span className="font-bold">Created on: </span>{convertTimestampToDate(this.state.startBlockTimeStamp)}.</p>
                    </div>
                </div>

                <div className="flex">
                    <div className="mt-4 card border w-1/2 mr-4">
                        <p className="mb-2 text-lg">Auction Bids</p>
                        <hr className="pb-4 border-slate-400" />
                        <p><span className="font-bold">Current Highest Bidder (Address): </span>{this.state.highestBidder}</p>
                        <p><span className="font-bold">Current Highest Bid: </span>{this.state.highestBid} ETH</p>
                        <p><span className="font-bold">Your Current Bid: </span>{this.state.userCurrentBid} ETH</p>

                        <p className="mt-2"><span className="font-bold">Total Number of Bids in this Auction: </span>{this.state.totalNumberOfBids}</p>
                    </div>

                    <div className="mt-4 flex card border w-1/2">
                        <div className="w-1/2">
                            <div className="mb-4 flex">Enter your Bid Value (Converts from Wei to ETH): <Tooltip header="Place Bid" message="Enter your bid value using the input below. Place and finalised your bid by clicking the blue button and accepting the MetaMask transaction. See your current bid value to market fiat currency using the green dropdown menu. NOTE: Bid values do not account for required gas fees." ></Tooltip></div>
                            <form onSubmit={this.onClickPlaceBid} className="flex">
                                {this.state.bidIncrement == 0 ? (<input type="number" min="0" step="any" placeholder="Insert ETH Amount" className="pt-2 border rounded p-2" onChange={this.handleBidValue} required />) : (<input type="number" min="0" step={this.state.bidIncrement} placeholder="Insert ETH Amount" className="pt-2 border rounded p-2" onChange={this.handleBidValue} required />)}
                                <button type="submit" id="bid" className="font-bold bg-blue-500 text-white rounded p-4 shadow-lg">
                                    Place Bid
                                </button>
                            </form>

                            <div className="mt-3">
                                {this.state.bidValue === null ? (<p className="italic">Enter bid value to convert to Fiat Currency...</p>) : (<div className="italic flex"><p className="mr-2">This is equivalent to... {this.state.ETHtoFiatConversion} {this.state.ETHtoFiatCurrency}</p> <Tooltip header="ETH to Fiat Conversion" message="This price conversion is done using the latest market price for ETH from https://www.cryptocompare.com/." ></Tooltip></div>)}
                            </div>
                        </div>

                        <select id="fiat" className="bg-emerald-600 rounded-r-lg text-white shadow-lg font-bold" onChange={this.handleFiatCurrency}>
                            <option value="GBP" selected="selected">GBP</option>
                            <option value="EUR">EUR</option>
                            <option value="USD">USD</option>
                        </select>

                        <div className="w-1/2 pl-10">
                            <div className="mb-4 flex"><p className="mr-1">Withdraw from Auction: </p><Tooltip header="Withdrawal of Bid" message="You can only withdraw once the Auction has expired (Ended or Cancelled status)." ></Tooltip></div>
                            {this.state.auctionStatus != 1 ? <button className="font-bold bg-slate-500 text-white rounded p-4 shadow-lg w-4/5" id="withdraw" onClick={this.onClickWithdraw} type="button">Withdraw
                                bids</button> : <button className="font-bold bg-slate-500 text-white rounded p-4 shadow-lg w-4/5 opacity-50 cursor-not-allowed" disabled id="withdraw" onClick={this.onClickWithdraw} type="button">Withdraw
                                    bids</button>}
                        </div>
                    </div>
                </div>

                <div className="flex">
                    <div id="auctionEventLogs" className="mt-4 card border w-8/12 mr-4">
                        <p className="mb-2 text-lg">Auction Event Logs</p>
                        <hr className="pb-4 border-slate-400" />
                        <p id="singleAuctionEventLog"></p>
                    </div>

                    <div id="auctionOwnerOperations" className="mt-4 card border w-4/12">
                        <div className="mb-2 text-lg flex"><p className="mr-1">Auction Owner Operations</p><Tooltip header="Auction Owner Operations" message="Only the Contract Owner of this Auction can perform these operations." ></Tooltip></div>
                        <hr className="pb-4 border-slate-400" />
                        <div className="flex">
                            {this.state.userAccount === this.state.owner ? <button className="font-bold bg-red-700 text-white rounded p-4 shadow-lg w-1/2 pb-4 mr-4" id="cancel" onClick={this.onClickCancel} type="button">Cancel Auction</button> :
                                <button className="font-bold bg-red-700 text-white rounded p-4 shadow-lg opacity-50 cursor-not-allowed w-1/2 pb-4 mr-4" disabled id="cancel" onClick={this.onClickCancel} type="button">Cancel Auction</button>}
                            {this.state.userAccount === this.state.owner ? <button className="font-bold bg-green-700 text-white rounded p-4 shadow-lg w-1/2" id="claim" onClick={this.onClickClaimWinningBid} type="button">Claim Winnings</button> :
                                <button className="font-bold bg-green-700 text-white rounded p-4 shadow-lg opacity-50 cursor-not-allowed w-1/2" disabled id="claim" onClick={this.onClickClaimWinningBid} type="button">Claim Winnings</button>}
                        </div>
                    </div>
                </div>
            </div>
        )
    };
})