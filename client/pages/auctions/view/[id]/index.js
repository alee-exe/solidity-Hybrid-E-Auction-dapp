import { Component, useState } from 'react';
import { withRouter, NextRouter } from 'next/router';
import Image from 'next/image';
import getWeb3 from '@/components/getWeb3.js';
import AuctionListing from '@/build/contracts/AuctionListing.json';
import Auction from '@/build/contracts/Auction.json';
import Alert from '@/components/Alert.js';
import { convertTimestampToDate, enumStatus } from '@/components/AuctionUtils.js';


export default withRouter(class Home extends Component {

    state = {
        web3Provider: null,
        userAccount: null,
        userTotalBids: null,
        contract: null,
        auctionContract: null,
        owner: null,
        itemName: null,
        itemCondition: null,
        itemDescription: null,
        ipfsImageHash: null,
        startBlockTimeStamp: null,
        endBlockTimeStamp: null,
        highestBidder: null,
        highestBid: null,
        auctionStatus: null,
        auctionTimer: null,
        auctionId: null,
        bidAlert: null,
        bidValue: null,
        bidEventLog: null
    };

    componentDidMount = async () => {

        try {
            const web3 = await getWeb3();
            const blockchainNetworkId = await web3.eth.net.getId();
            const contractAddress = await AuctionListing.networks[blockchainNetworkId].address;
            const contract = new web3.eth.Contract(AuctionListing['abi'], contractAddress);
            const userAddresses = await web3.eth.getAccounts();
            const userAccount = userAddresses[0];
            // web3.eth.defaultAccount = userAccount;

            const id = this.props.router.query.id - 1;

            const listedAuctions = await contract.methods.getListedAuctions().call();
            const auctionContract = new web3.eth.Contract(Auction['abi'], listedAuctions[id]);

            const owner = await contract.methods.getOwner(id).call();
            const startBlockTimeStamp = await contract.methods.getStartBlockTimeStamp(id).call();
            const endBlockTimeStamp = await contract.methods.getEndBlockTimeStamp(id).call();
            const highestBid = await contract.methods.getHighestBid(id).call();
            const highestBidConvert = web3.utils.fromWei(highestBid, 'ether');
            const highestBidder = await contract.methods.getHighestBidder(id).call();

            const auctionStatus = await contract.methods.getAuctionStatus(id).call();
            const auctionedItem = await contract.methods.getAuctionedItem(id).call();
            const auctionTimer = (endBlockTimeStamp - Math.floor(Date.now() / 1000));

            const itemName = auctionedItem[0];
            const itemDescription = auctionedItem[1];
            const itemCondition = auctionedItem[2];
            const ipfsImageHash = auctionedItem[3];

            const userTotalBids = await contract.methods.getUserTotalBids(id, userAccount).call();
            const userTotalBidsConvert = web3.utils.fromWei(userTotalBids, 'ether');

            this.setState({ web3Provider: web3, contract, auctionContract, userAccount, userTotalBids: userTotalBidsConvert, owner, itemName, itemCondition, itemDescription, ipfsImageHash, startBlockTimeStamp, endBlockTimeStamp, highestBidder, highestBid: highestBidConvert, auctionStatus, auctionTimer, auctionId: id });

            this.intervalAuctionTimer = setInterval(() => this.setState({ auctionTimer: endBlockTimeStamp - Math.floor(Date.now() / 1000) }), 1000);

            this.intervalAuctionStatus = setInterval(() => {
                if (this.state.auctionTimer <= 0) {
                    this.updateAuctionStatus();
                };
            }, 300000);

            this.intervalHighestBidder = setInterval(() => {
                this.updateHighestBidder();
                this.updateHighestBid();
            }, 3000);

            this.intervalUserTotalBids = setInterval(() => {
                this.updateUserTotalBids();
            }, 1000);

            this.updateAuctionStatus();
        } catch (error) {
            console.log(error);
        };
    }

    // Clear auction timer, status, highest bid, and bidder check to prevent memory leaks
    componentWillUnmount() {
        clearInterval(this.intervalAuctionTimer);
        clearInterval(this.intervalAuctionStatus);
        clearInterval(this.intervalHighestBidder);
        clearInterval(this.intervalUserTotalBids);
    }

    updateAuctionStatus() {
        if ((this.state.endBlockTimeStamp - Math.floor(Date.now() / 1000)) <= 0) {
            this.setState({ auctionStatus: 2 });
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
        const highestBid = await contract.methods.getHighestBid(auctionId).call();
        const newHighestBidConvert = web3Provider.utils.fromWei(highestBid, 'ether');

        if ((newHighestBidConvert !== this.state.highestBid)) {
            this.setState({ highestBid: newHighestBidConvert });
        };
    }

    updateUserTotalBids = async () => {
        const { contract, auctionId, userAccount, web3Provider } = this.state;
        const userTotalBids = await contract.methods.getUserTotalBids(auctionId, userAccount).call();
        const newUserTotalBidsConvert = web3Provider.utils.fromWei(userTotalBids, 'ether');

        if ((newUserTotalBidsConvert !== this.state.userTotalBids)) {
            this.setState({ userTotalBids: newUserTotalBidsConvert });
        };
    }


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
        const { auctionContract, web3Provider } = this.state;

        await auctionContract.events.bidEvent({ fromBlock: 'latest' })
            .on("error", (error) => {
                console.log(error);
            })
            .on("data", async (event) => {
                const userAddress = event.returnValues[0];
                const bidAmount = web3Provider.utils.fromWei(event.returnValues[1], 'ether');
                const transactionHash = event['transactionHash'];
                // const auctionAddress = event['address'];
                const bidEventLog = "New Bid from User Address: " + userAddress + " at " + bidAmount + " ETH. Transaction (TX) Hash at : " + transactionHash + " on " + convertTimestampToDate(Math.floor(Date.now() / 1000), "time") + ".";

                // Prevent duplicate logs
                if (this.state.bidEventLog !== bidEventLog) {
                    var eventMessage = document.createElement("p");
                    eventMessage.innerText = bidEventLog;
                    var horizontalRuler = document.createElement("hr");
                    document.getElementById("bidEventLogs").append(eventMessage);
                    document.getElementById("bidEventLogs").append(horizontalRuler);

                    this.setState({ bidEventLog });
                };
            });
    }

    handleBidValue = (event) => {
        this.setState({ bidValue: event.target.value });
    }

    onClickWithdraw = async (event) => {
        event.preventDefault();
        const { contract, web3Provider, userAccount, auctionId } = this.state;

        await contract.methods.withdraw(auctionId).send({ from: userAccount }).then(async (response) => {
            if (response) {
                const bidAlert = <Alert type="success">Successfully withdrawn!</Alert>;
                this.setState({ bidAlert });
            };
        }).catch((error) => {
            if (error) {
                const bidAlert = <Alert type="danger">Error: Could not withdraw. See console for more details.</Alert>;
                this.setState({ bidAlert });
            };
        });
    }

    render() {
        return (
            <div>
                {this.state.bidAlert}
                <div className="flex mt-4 card border">
                    <div className="row-span-3 pl-5 pt-5">
                        {this.state.ipfsImageHash === null ? (<p>Loading image...</p>) : (<Image src={`https://ipfs.infura.io/ipfs/${this.state.ipfsImageHash}`} width={670} height={440} priority={true}></Image>)}
                    </div>

                    <div className="row-span-2 col-span-2 pt-5 ml-10">
                        <h1 className="font-bold text-3xl pb-3">{this.state.itemName}</h1>
                        <hr className="pb-4 border-slate-400" />
                        <p className="font-bold italic text-lg">The owner has described/noted this item as:</p>
                        <p className="text-lg pb-3">"{this.state.itemDescription}"</p>
                        <p className="font-bold italic text-lg">The item's condition is as follows:</p>
                        <p className="text-lg pb-3">"{this.state.itemCondition}"</p>

                        <p className="pb-3"><span className="font-bold"> Auction Owner (Address): </span>{this.state.owner}</p>
                        <p className="pb-3"><span className="font-bold">Auction End Date: </span>{convertTimestampToDate(this.state.endBlockTimeStamp)} (remaining time: {convertTimestampToDate(this.state.auctionTimer, "time")})</p>

                        <p className="pb-3"><span className="font-bold">Auction Status: </span>{enumStatus(this.state.auctionStatus)}</p>
                        <p className="pb-3"><span className="font-bold">Created on: </span>{convertTimestampToDate(this.state.startBlockTimeStamp)}.</p>
                    </div>

                </div>

                <div className="flex">
                    <div className="mt-4 card border w-1/2 mr-4">
                        <p><span className="font-bold">Current Highest Bidder (Address): </span>{this.state.highestBidder}</p>
                        <p><span className="font-bold">Current Highest Bid: </span>{this.state.highestBid} ETH</p>
                        <p><span className="font-bold">Your Total Bids: </span>{this.state.userTotalBids} ETH</p>
                    </div>

                    <div className="mt-4 flex card border w-1/2">
                        <div className="w-1/2 mr-5">
                            <p className="mb-4">Enter your Bid Value (Converts from Wei to ETH): </p>
                            <form onSubmit={this.onClickPlaceBid} className="flex">
                                <input type="number" min="0" step="any" placeholder="Insert ETH Amount" className="pt-2 border rounded p-2" onChange={this.handleBidValue} required />
                                <button type="submit" className="font-bold bg-blue-500 text-white rounded p-4 shadow-lg">
                                    Place Bid
                                </button>
                            </form>
                        </div>

                        <div className="w-1/2 pl-10">
                            <p className="mb-4">Early Withdraw from Auction: </p>
                            <button className="font-bold bg-slate-500 text-white rounded p-4 shadow-lg w-4/5" id="withdraw" onClick={this.onClickWithdraw} type="button">Withdraw
                                bids</button>
                        </div>
                    </div>
                </div>

                <div className="flex">
                    <div id="bidEventLogs" className="mt-4 card border w-1/2 mr-4">
                        <p className="mb-2 text-lg">Auction Event Logs</p>
                        <hr className="pb-4 border-slate-400" />
                        <p id="eventLogs"></p>
                    </div>
                </div>
            </div>
        )
    };
})