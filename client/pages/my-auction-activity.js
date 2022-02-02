import { Component } from 'react';
import getWeb3 from '@/components/getWeb3.js';
import AuctionListing from '@/build/contracts/AuctionListing.json';
import AuctionPreview from '../components/AuctionPreview';
import Link from 'next/link';
import Tooltip from '../components/Tooltip.js';

export default class AuctionActivityPage extends Component {

    state = {
        web3Provider: null,
        contract: null,
        userOngoingAuctions: null,
        userOngoingAuctionIds: null,
        userExpiredAuctions: null,
        userExpiredAuctionIds: null,
        userPurchasedAuctions: null,
        userPurchasedAuctionIds: null
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
            let userOngoingAuctions = [];
            let userOngoingAuctionIds = [];
            let userExpiredAuctions = [];
            let userExpiredAuctionIds = [];
            let userPurchasedAuctions = [];
            let userPurchasedAuctionIds = [];

            for (let id = 0; id < listedAuctions.length; id++) {
                const auctionOwner = await contract.methods.getOwner(id).call();
                const auctionPurchaser = await contract.methods.getAuctionPurchaser(id).call();

                // Check which auctions the user is the owner of and the id of the auction
                if (userAccount === auctionOwner) {
                    const auctionStatus = await contract.methods.getAuctionStatus(id).call();

                    if (auctionStatus != 1) {
                        userExpiredAuctions.push(listedAuctions[id]);
                        userExpiredAuctionIds.push(id);
                    } else {
                        userOngoingAuctions.push(listedAuctions[id]);
                        userOngoingAuctionIds.push(id);
                    }
                };

                // Check if user has purchased the auction
                if (userAccount === auctionPurchaser) {
                    userPurchasedAuctions.push(listedAuctions[id]);
                    userPurchasedAuctionIds.push(id);
                };
            };

            this.setState({ web3Provider: web3, contract, userOngoingAuctions, userOngoingAuctionIds, userExpiredAuctions, userExpiredAuctionIds, userPurchasedAuctions, userPurchasedAuctionIds });
        } catch (error) {
            console.log(error);
        };
    }

    render() {
        return (
            <div className="border pl-20 pr-20 pt-10 pb-20">
                <h1 className="text-2xl font-bold pb-4"> Ongoing Auctions you have listed (Owner of) </h1>
                <hr className="border-slate-400 pb-4" />

                {this.state.userOngoingAuctions === null || this.state.userOngoingAuctions.length == 0 ? <p>You have not created any Auctions yet.</p> : (
                    this.state.userOngoingAuctions.map((auction, idx) => (
                        <div key={idx}>
                            <Link href={{ pathname: this.ROUTE_AUCTION_ID, query: { id: this.state.userOngoingAuctionIds[this.state.userOngoingAuctions.indexOf(auction)] + 1 } }}>
                                <a><span className="pl-2 border flex bg-green-200 font-semibold">Auction Contract: {auction}</span>
                                    <AuctionPreview web3={this.state.web3Provider} id={this.state.userOngoingAuctionIds[this.state.userOngoingAuctions.indexOf(auction)]} contract={this.state.contract}></AuctionPreview></a>
                            </Link>
                        </div>
                    ))
                )}

                <div className="text-2xl font-bold pt-10 pb-4 flex"> Expired Auctions you have listed (Owner of) <Tooltip header="Expired Auctions" message="Expired Auctions listed are Auctions that have the status of either CANCELLED or ENDED (I.e., no longer ONGOING)." ></Tooltip></div>
                <hr className="border-slate-400 pb-4" />
                {this.state.userExpiredAuctions === null || this.state.userExpiredAuctions.length == 0 ? <p>None of your created Auctions have expired yet.</p> : (
                    this.state.userExpiredAuctions.map((auction, idx) => (
                        <div key={idx}>
                            <Link href={{ pathname: this.ROUTE_AUCTION_ID, query: { id: this.state.userExpiredAuctionIds[this.state.userExpiredAuctions.indexOf(auction)] + 1 } }}>
                                <a><span className="pl-2 border flex bg-red-200 font-semibold">Auction Contract: {auction}</span>
                                    <AuctionPreview web3={this.state.web3Provider} id={this.state.userExpiredAuctionIds[this.state.userExpiredAuctions.indexOf(auction)]} contract={this.state.contract}></AuctionPreview></a>
                            </Link>
                        </div>
                    ))
                )}

                <div className="text-2xl font-bold pt-10 pb-4 flex"> Auctions you have purchased <Tooltip header="Purchased Auctions" message="Purchased Auctions are listed if you are the purchaser." ></Tooltip></div>
                <hr className="border-slate-400 pb-4" />
                {this.state.userPurchasedAuctions === null || this.state.userPurchasedAuctions.length == 0 ? <p>No Auctions purchased yet.</p> : (
                    this.state.userPurchasedAuctions.map((auction, idx) => (
                        <div key={idx}>
                            <Link href={{ pathname: this.ROUTE_AUCTION_ID, query: { id: this.state.userPurchasedAuctionIds[this.state.userPurchasedAuctions.indexOf(auction)] + 1 } }}>
                                <a><span className="pl-2 border flex bg-yellow-300 font-semibold">Auction Contract: {auction}</span>
                                    <AuctionPreview web3={this.state.web3Provider} id={this.state.userPurchasedAuctionIds[this.state.userPurchasedAuctions.indexOf(auction)]} contract={this.state.contract}></AuctionPreview></a>
                            </Link>
                        </div>
                    ))
                )}
            </div>
        )
    };
}