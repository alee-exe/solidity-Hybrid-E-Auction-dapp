import { Component, useEffect } from 'react';
import { withRouter, NextRouter } from 'next/router';
import Image from 'next/image';
import getWeb3 from '@/components/getWeb3.js';
import AuctionListing from '@/build/contracts/AuctionListing.json';
import Alert from '@/components/Alert.js'


export default withRouter(class Home extends Component {
    state = {
        web3Provider: null,
        userAccount: null,
        contract: null,
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
        auctionTimeLeft: null,
        auctionId: null,
        bidAlert: null,
        bidValue: null
    };

    componentDidMount = async () => {
        try {
            const web3 = await getWeb3();
            const blockchainNetworkId = await web3.eth.net.getId();
            const contractAddress = await AuctionListing.networks[blockchainNetworkId].address;
            const contract = new web3.eth.Contract(AuctionListing['abi'], contractAddress);
            const userAddresses = await web3.eth.getAccounts();

            const id = this.props.router.query.id - 1;

            const owner = await contract.methods.getOwner(id).call();
            const startBlockTimeStamp = await contract.methods.getStartBlockTimeStamp(id).call();
            const endBlockTimeStamp = await contract.methods.getEndBlockTimeStamp(id).call();
            const highestBid = await contract.methods.getHighestBid(id).call();
            const highestBidder = await contract.methods.getHighestBidder(id).call();

            const auctionStatus = await contract.methods.getAuctionStatus(id).call();
            const auctionedItem = await contract.methods.getAuctionedItem(id).call();
            const auctionTimeLeft = endBlockTimeStamp - Math.floor(Date.now() / 1000);

            const itemName = auctionedItem[0];
            const itemDescription = auctionedItem[1];
            const itemCondition = auctionedItem[2];
            const ipfsImageHash = auctionedItem[3];

            this.setState({ web3Provider: web3, userAccount: userAddresses[0], contract, owner, itemName, itemCondition, itemDescription, ipfsImageHash, startBlockTimeStamp, endBlockTimeStamp, highestBidder, highestBid, auctionStatus, auctionTimeLeft, auctionId: id })

        } catch (error) {
            console.log(error);
        }
    };

    componentDidUpdate = async (prevState) => {
        if (prevState.data !== this.state.data) {
            this.updateAuctionTimeLeft();
            this.updateAuctionStatus();
        }
    };

    // useEffect = () => {
    //     this.updateAuctionTimeLeft();
    //     this.updateAuctionStatus();
    // };


    convertTimestampToDate(timestamp, mode) {
        if (timestamp <= 0) {
            return 0;
        }

        // convert to JS timestamp in miliseconds from Unix timestamp in seconds since Unix epoch
        const date = new Date(timestamp * 1000);
        var conversion = null;

        if (mode !== "time") {
            conversion = date.getDate() + '/' + (date.getMonth() + 1) + '/' + date.getFullYear() + " at " + date.getHours() + ":" + (date.getMinutes() < 10 ? '0' : '') + date.getMinutes();
        } else {
            conversion = date.getHours() + ":" + (date.getMinutes() < 10 ? '0' : '') + date.getMinutes() + ":" + (date.getSeconds() < 10 ? '0' : '') + date.getSeconds();
        }
        return conversion;
    };

    enumStatus(enum_index) {
        const status = ["CANCELLED", "ONGOING", "ENDED"];
        return (status[enum_index]);
    };

    updateAuctionTimeLeft() {
        const timeRemaining = this.state.endBlockTimeStamp - Math.floor(Date.now() / 1000);
        this.setState({ auctionTimeLeft: timeRemaining});
    }

    updateAuctionStatus() {
        if (this.state.endBlockTimeStamp - Math.floor(Date.now() / 1000) <= 0) {
            this.setState({ auctionStatus: 2 });
        }
    }

    onClickPlaceBid = async (event) => {
        event.preventDefault();
        const { contract, web3Provider, userAccount, bidValue, auctionId } = this.state;

        await contract.methods.placeBid(auctionId).send({ from: userAccount, value: web3Provider.utils.toWei(bidValue, 'ether'), gas: 200000 }).then(async (response) => {
            if (response) {
                const bidAlert = <Alert type="success">Successfully placed Bid!</Alert>;
                this.setState({ bidAlert });
            }
        }).catch((error) => {
            if (error) {
                const bidAlert = <Alert type="danger">Error: Could not place Bid. See console for more details.</Alert>;
                this.setState({ bidAlert });
            }
        });

    };

    handleBidValue = (event) => {
        this.setState({ bidValue: event.target.value });
    };


    render() {
        return (
            <div>
                {this.state.bidAlert}
                <div className="flex mt-4 card border">
                    <div className="row-span-3 pl-5 pt-5">
                        {this.state.ipfsImageHash === null ? (<p>Loading image...</p>) : (<Image src={`https://ipfs.infura.io/ipfs/${this.state.ipfsImageHash}`} width={670} height={440}></Image>)}
                    </div>

                    <div className="row-span-2 col-span-2 pt-5 ml-10">
                        <h1 className="font-bold text-3xl pb-3">{this.state.itemName}</h1>
                        <hr className="pb-4 border-slate-400" />
                        <p className="font-bold italic text-lg">The owner has described/noted this item as:</p>
                        <p className="text-lg pb-3">"{this.state.itemDescription}"</p>
                        <p className="font-bold italic text-lg">The item's condition is as follows:</p>
                        <p className="text-lg pb-3">"{this.state.itemCondition}"</p>



                        <p className="pb-3"><span className="font-bold">Created By Auction Owner (Address): </span>{this.state.owner}, on the <span className="font-bold">{this.convertTimestampToDate(this.state.startBlockTimeStamp)}.</span></p>
                        <p className="pb-3"><span className="font-bold">Auction End Date: </span>{this.convertTimestampToDate(this.state.endBlockTimeStamp)} (remaining time: {this.convertTimestampToDate(this.state.auctionTimeLeft, "time")})</p>
                        {/* <p><span className="font-bold">Current Highest Bidder (Address): </span>{this.state.highestBidder}</p>
                    <p><span className="font-bold">Current Highest Bid: </span>{this.state.highestBid}</p> */}

                        <p className="pb-3"><span className="font-bold">Auction Status: </span>{this.enumStatus(this.state.auctionStatus)}</p>

                        <p className="pb-3"><span className="font-bold">Item Name: </span>{this.state.itemName}</p>
                        <p className="pb-3"><span className="font-bold">Item Description: </span>{this.state.itemDescription}</p>
                        <p className="pb-3"><span className="font-bold">Item Condition: </span>{this.state.itemCondition}</p>
                    </div>

                </div>

                <div className="flex mt-4 card border">
                    <form onSubmit={this.onClickPlaceBid} className="flex justify-center border">
                        <input type="number" min="0" step="any" placeholder="Insert ETH Amount" className="pt-2 border rounded p-2" onChange={this.handleBidValue} required />
                        <button type="submit" className="font-bold bg-blue-500 text-white rounded p-4 shadow-lg">
                            Place Bid
                        </button>
                    </form>
                </div>
            </div>
        )
    }
})