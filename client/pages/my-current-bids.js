import { Component } from 'react';
import getWeb3 from '@/components/getWeb3.js';
import AuctionListing from '@/build/contracts/AuctionListing.json';
import AuctionPreview from '../components/AuctionPreview';
import Link from 'next/link';

export default class CurrentBidsPage extends Component {

    state = {
        web3Provider: null,
        contract: null,
        userBiddedAuctions: null,
        userBiddedAuctionIds: null,
        userWonAndExpiredAuctions: null,
        userWonAndExpiredAuctionIds: null,
        userLostAndExpiredAuctions: null,
        userLostAndExpiredAuctionIds: null
    };

    ROUTE_AUCTION_ID = "auctions/view/[id]";

    componentDidMount = async () => {
        try {
            const web3 = await getWeb3();
            const blockchainNetworkId = await web3.eth.net.getId();
            const contractAddress = await AuctionListing.networks[blockchainNetworkId].address;
            const contract = new web3.eth.Contract(AuctionListing['abi'], contractAddress);
            const userAddresses = await web3.eth.getAccounts();
            const userAccount = userAddresses[0];

            const listedAuctions = await contract.methods.getListedAuctions().call();

            // Bidded and ongoing auctions
            let userBiddedAuctions = [];
            let userBiddedAuctionIds = [];

            // Bidded and won auctions
            let userWonAndExpiredAuctions = [];
            let userWonAndExpiredAuctionIds = [];

            // Bidded but lost auctions
            let userLostAndExpiredAuctions = [];
            let userLostAndExpiredAuctionIds = [];

            for (let id = 0; id < listedAuctions.length; id++) {
                const userCurrentBid = web3.utils.fromWei(await contract.methods.getUserCurrentBid(id, userAccount).call(), 'ether');

                if (userCurrentBid > 0) {
                    const auctionStatus = await contract.methods.getAuctionStatus(id).call();
                    const highestBidder = await contract.methods.getHighestBidder(id).call();

                    if (userAccount === highestBidder) {
                        if (auctionStatus != 1) {
                            userWonAndExpiredAuctions.push(listedAuctions[id]);
                            userWonAndExpiredAuctionIds.push(id);
                        } else {
                            userBiddedAuctions.push(listedAuctions[id]);
                            userBiddedAuctionIds.push(id);
                        };
                    } else {
                        if (auctionStatus != 1) {
                            userLostAndExpiredAuctions.push(listedAuctions[id]);
                            userLostAndExpiredAuctionIds.push(id);
                        } else {
                            userBiddedAuctions.push(listedAuctions[id]);
                            userBiddedAuctionIds.push(id);
                        };
                    }
                };
            };

            this.setState({ web3Provider: web3, contract, userBiddedAuctions, userBiddedAuctionIds, userWonAndExpiredAuctions, userWonAndExpiredAuctionIds, userLostAndExpiredAuctions, userLostAndExpiredAuctionIds });
        } catch (error) {
            console.log(error);
        };
    }


    render() {
        return (
            // TO-DO: Change the auction preview container to something with a withdraw button instead?
            <div className="border pl-20 pr-20 pt-10 pb-20">
                <h1 className="text-2xl font-bold pb-4"> Your Current Bids </h1>
                <hr className="border-slate-400 pb-4" />
                {this.state.userBiddedAuctions === null || this.state.userBiddedAuctions.length == 0 ? <p>You have not created any Bids on Auctions yet.</p> : (
                    this.state.userBiddedAuctions.map((auction, idx) => (
                        <div key={idx}>
                            <Link href={{ pathname: this.ROUTE_AUCTION_ID, query: { id: this.state.userBiddedAuctionIds[this.state.userBiddedAuctions.indexOf(auction)] + 1 } }}>
                                <a><span className="pl-2 border flex bg-slate-300 font-semibold">Auction Contract: {auction}</span>
                                    <AuctionPreview web3={this.state.web3Provider} id={this.state.userBiddedAuctionIds[this.state.userBiddedAuctions.indexOf(auction)]} contract={this.state.contract}></AuctionPreview></a>
                            </Link>
                        </div>
                    ))
                )}

                <h1 className="text-2xl font-bold pt-10 pb-4"> Your Winning Bids </h1>
                <hr className="border-slate-400 pb-4" />
                {this.state.userWonAndExpiredAuctions === null || this.state.userWonAndExpiredAuctions.length == 0 ? <p>Your Bids have not won on any Auctions yet.</p> : (
                    this.state.userWonAndExpiredAuctions.map((auction, idx) => (
                        <div key={idx}>
                            <Link href={{ pathname: this.ROUTE_AUCTION_ID, query: { id: this.state.userWonAndExpiredAuctionIds[this.state.userWonAndExpiredAuctions.indexOf(auction)] + 1 } }}>
                                <a><span className="pl-2 border flex bg-green-200 font-semibold">Auction Contract: {auction}</span>
                                    <AuctionPreview web3={this.state.web3Provider} id={this.state.userWonAndExpiredAuctionIds[this.state.userWonAndExpiredAuctions.indexOf(auction)]} contract={this.state.contract}></AuctionPreview></a>
                            </Link>
                        </div>
                    ))
                )}

                <h1 className="text-2xl font-bold pt-10 pb-4"> Your Expired Bids (Withdrawable) </h1>
                <hr className="border-slate-400 pb-4" />
                {this.state.userLostAndExpiredAuctions === null || this.state.userLostAndExpiredAuctions.length == 0 ? <p>Your Bids have not been unredeemed on any expired Auctions yet.</p> : (
                    this.state.userLostAndExpiredAuctions.map((auction, idx) => (
                        <div key={idx}>
                            <Link href={{ pathname: this.ROUTE_AUCTION_ID, query: { id: this.state.userLostAndExpiredAuctionIds[this.state.userLostAndExpiredAuctions.indexOf(auction)] + 1 } }}>
                                <a><span className="pl-2 border flex bg-red-200 font-semibold">Auction Contract: {auction}</span>
                                    <AuctionPreview web3={this.state.web3Provider} id={this.state.userLostAndExpiredAuctionIds[this.state.userLostAndExpiredAuctions.indexOf(auction)]} contract={this.state.contract}></AuctionPreview></a>
                            </Link>
                        </div>
                    ))
                )}
            </div>
        )
    };
}