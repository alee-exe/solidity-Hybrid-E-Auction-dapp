import { Component, useState } from 'react';
import { withRouter, NextRouter } from 'next/router';
import Image from 'next/image';
import getWeb3 from '@/components/getWeb3.js';
import AuctionListing from '@/build/contracts/AuctionListing.json';
import Auction from '@/build/contracts/Auction.json';
import Alert from '@/components/Alert.js';
import Tooltip from '@/components/Tooltip.js';
import LoadingImage from '@/components/images/loading-cycle.gif';
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
        ownerContactDetails: null,
        startingBid: null,
        bidIncrement: null,
        sellingPrice: null,
        auctionTypeIsPrivate: null,
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
            const ownerContactDetails = await contract.methods.getOwnerContactDetails(id).call();
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
            const auctionTypeIsPrivate = await contract.methods.getIsPrivate(id).call();
            const auctionPurchaser = await contract.methods.getAuctionPurchaser(id).call();

            const itemName = auctionedItem[0];
            const itemDescription = auctionedItem[1];
            const itemCondition = auctionedItem[2];
            const ipfsImageHash = auctionedItem[3];

            const userCurrentBid = web3.utils.fromWei(await contract.methods.getUserCurrentBid(id, userAccount).call(), 'ether');
            const totalNumberOfBids = await contract.methods.getTotalNumberOfBids(id).call();

            this.setState({ web3Provider: web3, contract, auctionContract, auctionAddress, userAccount, userCurrentBid, totalNumberOfBids, owner, ownerContactDetails, startingBid, bidIncrement, sellingPrice, auctionTypeIsPrivate, auctionPurchaser, itemName, itemCondition, itemDescription, ipfsImageHash, startBlockTimeStamp, endBlockTimeStamp, highestBidder, highestBid, auctionStatus, auctionTimer, auctionId: id });

            this.intervalAuctionTimer = setInterval(() => this.setState({ auctionTimer: (endBlockTimeStamp - (Math.floor(Date.now() / 1000))) }), 1000);

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

            this.listenToBidEvents(0);
            this.listenToStateEvents(0);
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
        let hasUserEndedAuction = false;
        // Check if auction has ended
        if ((this.state.endBlockTimeStamp - Math.floor(Date.now() / 1000)) <= 0 && this.state.auctionStatus == 1) {
            console.log("AUCTION HAS ENDED");

            // User must accept the new state
            if (!hasUserEndedAuction) {
                const auctionStatusEnded = await contract.methods.endAuction(auctionId).send({ from: userAccount }).then(async (response) => {
                    if (response) {
                        hasUserEndedAuction = true;
                        this.setState({ auctionStatus: auctionStatusEnded });
                        const bidAlert = <Alert type="success">Successfully ended Auction!</Alert>;
                        this.setState({ bidAlert });
                    };
                }).catch((error) => {
                    if (error) {
                        console.log(error);
                    };
                });
            }
        };

        // Check if auction has been cancelled, ended, or sold
        const auctionStatusCheck = await contract.methods.getAuctionStatus(auctionId).call();
        if (auctionStatusCheck != this.state.auctionStatus) {
            this.setState({ auctionStatus: auctionStatusCheck });
            this.updateAuctionPurchaser();
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

    updateAuctionPurchaser = async () => {
        const { contract, auctionId } = this.state;
        const newAuctionPurchaser = await contract.methods.getAuctionPurchaser(auctionId).call();

        if ((newAuctionPurchaser !== this.state.auctionPurchaser)) {
            this.setState({ auctionPurchaser: newAuctionPurchaser });
        };
    }

    // event prevent default to allow user to accept MetaMask transaction
    onClickPlaceBid = async (event) => {
        event.preventDefault();
        const { contract, web3Provider, userAccount, bidValue, auctionId } = this.state;

        await contract.methods.placeBid(auctionId).send({ from: userAccount, value: web3Provider.utils.toWei(bidValue, 'ether'), gas: 200000 }).then(async (response) => {
            if (response) {
                console.log(response);
                const bidAlert = <Alert type="success">Successfully placed Bid!</Alert>;
                this.setState({ bidAlert });
            };
        }).catch((error) => {
            if (error) {
                console.log(error);
                const bidAlert = <Alert type="danger">Error: Could not place Bid. See console for more details.</Alert>;
                this.setState({ bidAlert });
            };
        });
    }

    listenToBidEvents(fromBlockNumber) {
        const { auctionContract } = this.state;
        console.log('Listening for Bid Events');
        auctionContract.events.bidEvent({ fromBlock: fromBlockNumber || 0 }, this.bidEventListener);
    }

    bidEventListener(error, BidEvent) {
        if (error) {
            console.log("Bid Event Listener Error", error);
            return null;
        }

        const {
            returnValues,
            blockNumber,
            transactionHash
        } = BidEvent;

        const {
            bidder,
            bidValue
        } = returnValues;

        const div = document.querySelector('#auctionEventLogs > div');

        // Private Auction should not display any bid events
        if (div !== null || undefined) {
            if (div.hasChildNodes()) {
                // Prevent bid event log dupes by checking the latest bid event block number
                if (!div.childNodes[1].innerHTML.includes("block #" + blockNumber)) {
                    const p = document.createElement('p');
                    p.innerHTML = "<span class='font-bold'>New Bid from User Address: </span>" + bidder + " at " + bidValue + " wei <i>(block #" + blockNumber + ")</i>. <br/><span class='font-bold'>Transaction (TX) Hash at: </span>" + transactionHash + ".";
                    const hr = document.createElement('hr');
                    hr.className = "mb-4 mt-4"
                    div.insertBefore(p, div.firstChild);
                    div.insertBefore(hr, div.firstChild);
                }
            } else {
                const p = document.createElement('p');
                p.innerHTML = "<span class='font-bold'>New Bid from User Address: </span>" + bidder + " at " + bidValue + " wei <i>(block #" + blockNumber + ")</i>. <br/><span class='font-bold'>Transaction (TX) Hash at: </span>" + transactionHash + ".";
                const hr = document.createElement('hr');
                hr.className = "mb-4 mt-4"
                div.insertBefore(p, div.firstChild);
                div.insertBefore(hr, div.firstChild);
            }
        }
    }

    listenToStateEvents(fromBlockNumber) {
        const { auctionContract } = this.state;
        console.log('Listening for State Events');
        auctionContract.events.stateEvent({ fromBlock: fromBlockNumber || 0 }, this.stateEventListener);
    }

    stateEventListener(error, StateEvent) {
        if (error) {
            console.log("State Event Listener Error", error);
            return null;
        }

        const {
            returnValues,
            blockNumber,
            transactionHash
        } = StateEvent;

        const {
            caller,
            auctionStatus
        } = returnValues;

        const div = document.querySelector('#auctionEventLogs > div');

        if (div !== null || undefined) {
            if (div.hasChildNodes()) {
                if (!div.childNodes[1].innerHTML.includes("block #" + blockNumber)) {
                    const p = document.createElement('p');
                    p.innerHTML = "<span class='font-bold'>Auction State has been changed to " + enumStatus(auctionStatus) + "</span> <i>(block #" + blockNumber + ")</i>. <br/><span class='font-bold'>Invoked by User Address: </span>" + caller + "<br/> <span class='font-bold'>Transaction (TX) Hash at: </span>" + transactionHash + ".";
                    const hr = document.createElement('hr');
                    hr.className = "mb-4 mt-4"
                    div.insertBefore(p, div.firstChild);
                    div.insertBefore(hr, div.firstChild);
                }
            } else {
                const p = document.createElement('p');
                p.innerHTML = "<span class='font-bold'>Auction State has been changed to " + enumStatus(auctionStatus) + "</span> <i>(block #" + blockNumber + ")</i>. <br/><span class='font-bold'>Invoked by User Address: </span>" + caller + "<br/> <span class='font-bold'>Transaction (TX) Hash at: </span>" + transactionHash + ".";
                const hr = document.createElement('hr');
                hr.className = "mb-4 mt-4"
                div.insertBefore(p, div.firstChild);
                div.insertBefore(hr, div.firstChild);
            }
        }
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
            };
        }).catch((error) => {
            if (error) {
                const bidAlert = <Alert type="danger">Error: Could not withdraw. See console for more details.</Alert>;
                this.setState({ bidAlert });
            };
        });
    }

    onClickCancel = async (event) => {
        event.preventDefault();
        const { contract, userAccount, auctionId } = this.state;

        await contract.methods.cancelAuction(auctionId).send({ from: userAccount }).then(async (response) => {
            if (response) {
                const bidAlert = <Alert type="success">Successfully cancelled this Auction.</Alert>;
                this.setState({ bidAlert });
            };
        }).catch((error) => {
            if (error) {
                const bidAlert = <Alert type="danger">Error: Could not cancel auction. See console for more details.</Alert>;
                this.setState({ bidAlert });
            };
        });
    }

    onClickClaimWinningBid = async (event) => {
        event.preventDefault();
        const { contract, userAccount, auctionId } = this.state;

        await contract.methods.claimWinningBid(auctionId).send({ from: userAccount }).then(async (response) => {
            if (response) {
                const bidAlert = <Alert type="success">Successfully claimed the winning bid!</Alert>;
                this.setState({ bidAlert });
            };
        }).catch((error) => {
            if (error) {
                const bidAlert = <Alert type="danger">Error: Could not claim the winning bid. See console for more details.</Alert>;
                this.setState({ bidAlert });
            };
        });

    }

    onClickBuyAuction = async (event) => {
        event.preventDefault();
        const { contract, userAccount, auctionId, web3Provider, sellingPrice } = this.state;

        await contract.methods.buyAuction(auctionId).send({ from: userAccount, value: web3Provider.utils.toWei(sellingPrice, 'ether'), gas: 200000 }).then(async (response) => {
            if (response) {
                const bidAlert = <Alert type="success">Successfully purchased Auction!</Alert>;
                this.setState({ bidAlert });
            };
        }).catch((error) => {
            if (error) {
                const bidAlert = <Alert type="danger">Error: Could not purchase Auction. See console for more details.</Alert>;
                this.setState({ bidAlert });
            };
        });
    }

    // Fetches the price of 1 ETH to Fiat currencies
    fetchETHtoFiatCurrency = async () => {
        const { data } = await axios.get(`https://min-api.cryptocompare.com/data/price?fsym=ETH&tsyms=USD,EUR,GBP`);
        const { ETHtoFiatCurrency, bidValue } = this.state;

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
        return (<div>
            {this.state.bidAlert}
            <div className="px-4 mt-4 pt-2 border rounded-md bg-slate-200 font-semibold">
                <h1 className="text-2xl mb-2"><span className="font-bold">Auction (Smart Contract Address): </span>{this.state.auctionAddress}</h1>
                <hr className="border-slate-400 mb-4" />
            </div>

            <div className="flex mt-4 card border bg-slate-50">
                <div className="row-span-3 pl-5 pt-5">
                    {this.state.ipfsImageHash === null ? (<Image src={LoadingImage} width={670} height={440} priority={true}></Image>) : (<Image src={`https://ipfs.infura.io/ipfs/${this.state.ipfsImageHash}`} width={670} height={440} priority={true}></Image>)}
                </div>

                <div className="row-span-2 col-span-2 pt-5 ml-10 leading-4">
                    <h1 className="font-bold text-3xl pb-3">{this.state.itemName === null ? (<span>&nbsp;</span>) : (this.state.itemName)}</h1>
                    <hr className="pb-4 border-slate-400" />
                    <p className="font-bold italic text-lg">The owner has described/noted this item as:</p>
                    <p className="text-lg pb-3">{this.state.itemDescription === null ? (<span>&nbsp;</span>) : (<span>&quot;{this.state.itemDescription}&quot;</span>)}</p>
                    <p className="font-bold italic text-lg">The item's condition is as follows:</p>
                    <p className="text-lg pb-3">{this.state.itemCondition === null ? (<span>&nbsp;</span>) : (<span>&quot;{this.state.itemCondition}&quot;</span>)}</p>

                    <p className="pb-3"><span className="font-bold">Auction Owner (Address): </span>{this.state.owner}</p>
                    <p className="pb-3"><span className="font-bold">Auction Owner Contact Details: </span>{this.state.ownerContactDetails}</p>
                    {/* <p className="pb-3"><span className="font-bold">Auction Contract (Address): </span>{this.state.auctionAddress}</p> */}
                    <p className="pb-3"><span className="font-bold">Auction End Date: </span>{this.state.endBlockTimeStamp === null || this.state.auctionStatus === null ? null : (<span>{convertTimestampToDate(this.state.endBlockTimeStamp)} (remaining time: {this.state.auctionStatus != 1 ? (enumStatus(this.state.auctionStatus)) : (convertTimestampToDate(this.state.auctionTimer, "time"))})</span>)}</p>

                    <p className="pb-3"><span className="font-bold">Auction Status: </span>{enumStatus(this.state.auctionStatus)}</p>
                    <p className="pb-3"><span className="font-bold">Auction Type: </span>{this.state.auctionTypeIsPrivate === null ? null : (checkAuctionType(this.state.auctionTypeIsPrivate))}</p>

                    {this.state.startingBid === null ? null : (this.state.startingBid == 0 ? null : (<p className="pb-3"><span className="font-bold">Starting Bid: </span>{this.state.startingBid} ETH</p>))}
                    {this.state.bidIncrement === null ? null : (this.state.bidIncrement == 0 ? null : (<p className="pb-3"><span className="font-bold">Bid Increment: </span>{this.state.bidIncrement} ETH</p>))}
                    {this.state.sellingPrice === null ? null : (this.state.sellingPrice == 0 ? null : (<p className="pb-3"><span className="font-bold">Selling Price: </span>{this.state.sellingPrice} ETH</p>))}

                    <p className="pb-3"><span className="font-bold">Created on: </span>{this.state.startBlockTimeStamp === null ? null : (<span>{convertTimestampToDate(this.state.startBlockTimeStamp)}&#46;</span>)}</p>

                    {this.state.sellingPrice === null || this.state.auctionStatus === null ? null : (this.state.sellingPrice > 0 && this.state.auctionStatus == 1 ? (<button className="font-bold bg-blue-500 text-white rounded p-4 shadow-lg w-2/5" id="purchase" onClick={this.onClickBuyAuction} type="button">Buy Now</button>) : null)}
                    {this.state.auctionPurchaser === null ? null : (this.state.auctionPurchaser === "0x0000000000000000000000000000000000000000" ? null : (<p className="pb-3"><span className="font-bold">Purchased by (Address): </span>{this.state.auctionPurchaser}</p>))}
                </div>
            </div>

            <div className="flex">
                <div className="mt-4 card border w-1/2 mr-4 bg-slate-50">
                    <p className="mb-2 text-xl">Auction Bids</p>
                    <hr className="pb-4 border-slate-400" />
                    <p><span className="font-bold">Your Current Bid: </span>{this.state.userCurrentBid === null ? null : (<span>{this.state.userCurrentBid} ETH</span>)}</p>
                    {this.state.auctionTypeIsPrivate === null ? null : (this.state.auctionStatus === null ? null : (this.state.auctionTypeIsPrivate && this.state.auctionStatus == 1 ? null : (this.state.auctionStatus == 2 ? (<div><p><span className="font-bold">Winning Bidder (Address): </span>{this.state.highestBidder}</p> <p><span className="font-bold">Winning Highest Bid: </span>{this.state.highestBid} ETH</p></div>) : (<div><p><span className="font-bold">Current Highest Bidder (Address): </span>{this.state.highestBidder}</p> <p><span className="font-bold">Current Highest Bid: </span>{this.state.highestBid} ETH</p></div>))))}
                    <p className="mt-2"><span className="font-bold">Total Number of Bids in this Auction: </span>{this.state.totalNumberOfBids}</p>
                </div>

                <div className="mt-4 flex card border w-1/2 bg-slate-50">
                    <div className="w-1/2">
                        <div className="mb-4 flex text-lg">Enter your Bid Value (Converts from Wei to ETH): <Tooltip header="Place Bid" message="Enter your bid value using the input below. Submit your bid by entering a value and accepting the MetaMask transaction. Convert your bid value to the current market fiat price using the currency dropdown menu. NOTE: Bid values do not account for required gas fees." ></Tooltip></div>
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
                        <div className="mb-4 flex text-lg"><p className="mr-1">Withdraw from Auction: </p><Tooltip header="Withdrawal of Bid" message="You can only withdraw once the Auction has expired (Ended or Cancelled status)." ></Tooltip></div>
                        {this.state.auctionStatus != 1 ? <button className="font-bold bg-slate-500 text-white rounded p-4 shadow-lg w-4/5" id="withdraw" onClick={this.onClickWithdraw} type="button">Withdraw
                            bids</button> : <button className="font-bold bg-slate-500 text-white rounded p-4 shadow-lg w-4/5 opacity-50 cursor-not-allowed" disabled id="withdraw" onClick={this.onClickWithdraw} type="button">Withdraw
                                bids</button>}
                    </div>
                </div>
            </div>

            <div className="flex">
                <div id="auctionEventLogs" className="mt-4 card border w-8/12 mr-4 bg-slate-50">
                    <p className="mb-2 text-xl">Auction Event Logs</p>
                    <hr className="pb-4 border-slate-400" />
                    {this.state.auctionTypeIsPrivate && this.state.auctionStatus == 1 ? (<p className="italic text-lg">Auction Type is Private - No Bid Events Shown</p>) : (<div></div>)}
                </div>

                <div id="auctionOwnerOperations" className="mt-4 card border w-4/12 bg-slate-50 h-min">
                    <div className="mb-2 text-xl flex"><p className="mr-1">Auction Owner Operations</p><Tooltip header="Auction Owner Operations" message="Only the Contract Owner of this Auction can perform these operations." ></Tooltip></div>
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
});