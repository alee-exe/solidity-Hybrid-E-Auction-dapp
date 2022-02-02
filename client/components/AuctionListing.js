import { Component } from 'react';

import AuctionListing from '../build/contracts/AuctionListing.json';
import getWeb3 from './getWeb3';
import AuctionPreview from '../components/AuctionPreview';
import Link from 'next/link';


export default class AuctionListingComponent extends Component {

    state = {
        auctionListing: null,
        web3Provider: null,
        userAccount: null,
        contract: null,
        selectedFilter: "All",
        userOwnedAuctions: null,
        userOwnedAuctionIds: null,
        userNotOwnedAuctions: null,
        userNotOwnedAuctionIds: null
    };

    ROUTE_AUCTION_ID = "auctions/view/[id]";

    componentDidMount = async () => {
        try {
            const web3 = await getWeb3();
            const blockchainNetworkId = await web3.eth.net.getId();
            const contractAddress = await AuctionListing.networks[blockchainNetworkId].address;
            const contract = new web3.eth.Contract(AuctionListing['abi'], contractAddress);
            const userAddresses = await web3.eth.getAccounts();
            const auctionListing = await contract.methods.getListedAuctions().call();
            const userAccount = userAddresses[0];

            let userOwnedAuctions = [];
            let userOwnedAuctionIds = [];
            let userNotOwnedAuctions = [];
            let userNotOwnedAuctionIds = [];

            for (let id = 0; id < auctionListing.length; id++) {
                const auctionOwner = await contract.methods.getOwner(id).call();

                // Check which auctions the user is the owner of and the id of the auction
                if (userAccount === auctionOwner) {
                    userOwnedAuctions.push(auctionListing[id]);
                    userOwnedAuctionIds.push(id);
                } else {
                    userNotOwnedAuctions.push(auctionListing[id]);
                    userNotOwnedAuctionIds.push(id);
                };
            };

            this.setState({ auctionListing, web3Provider: web3, userAccount, contract, userOwnedAuctions, userOwnedAuctionIds, userNotOwnedAuctions, userNotOwnedAuctionIds });
        } catch (error) {
            console.log(error);
        };
    }

    handleFilterSelection = (event) => {
        this.setState({ selectedFilter: event.target.value });
    }

    render() {
        return (
            <div>
                {this.state.auctionListing === null ? null : (
                    <div className="flex justify-center pt-10 border">
                        <div className="w-4/5 flex flex-col pb-12">
                            <h1 className="pt-4 pb-3 text-2xl font-bold">Auction Listings </h1>
                            <hr className="border-slate-400 pb-4" />

                            <div className="border flex pl-2 mb-4">
                                <h1>Filter by:  <select id="filter" className="bg-slate-500 text-white shadow-lg font-bold" onChange={this.handleFilterSelection}>
                                    <option value="All">All</option>
                                    <option value="Owned">Owned</option>
                                    <option value="Not Owned">Not Owned</option>
                                </select></h1>
                            </div>

                            <div className="border flex pl-2 mb-4">
                                {this.state.selectedFilter === "All" ? (<h1>Showing {this.state.auctionListing.length} auctions in total.</h1>) : null}
                                {this.state.selectedFilter === "Owned" ? (<h1>Showing {this.state.userOwnedAuctions.length} auctions in total.</h1>) : null}
                                {this.state.selectedFilter === "Not Owned" ? (<h1>Showing {this.state.userNotOwnedAuctions.length} auctions in total.</h1>) : null}
                            </div>

                            {this.state.selectedFilter === "All" ? (<div>
                                {this.state.auctionListing.map((auction, idx) => (
                                    <div key={idx}>
                                        <Link href={{ pathname: this.ROUTE_AUCTION_ID, query: { id: idx + 1 } }}>
                                            <a><span className="pl-2 border flex bg-slate-300 font-semibold">Auction Contract: {auction}</span>
                                                <AuctionPreview web3={this.state.web3Provider} id={idx} contract={this.state.contract}></AuctionPreview></a></Link>
                                    </div>
                                ))}
                            </div>) : null}

                            {this.state.selectedFilter === "Owned" ? (<div>
                                {this.state.userOwnedAuctions.map((auction, idx) => (
                                    <div key={idx}>
                                        <Link href={{ pathname: this.ROUTE_AUCTION_ID, query: { id: this.state.userOwnedAuctionIds[this.state.userOwnedAuctions.indexOf(auction)] + 1 } }}>
                                            <a><span className="pl-2 border flex bg-slate-300 font-semibold">Auction Contract: {auction}</span>
                                                <AuctionPreview web3={this.state.web3Provider} id={this.state.userOwnedAuctionIds[this.state.userOwnedAuctions.indexOf(auction)]} contract={this.state.contract}></AuctionPreview></a></Link>
                                    </div>
                                ))}
                            </div>) : null}

                            {this.state.selectedFilter === "Not Owned" ? (<div>
                                {this.state.userNotOwnedAuctions.map((auction, idx) => (
                                    <div key={idx}>
                                        <Link href={{ pathname: this.ROUTE_AUCTION_ID, query: { id: this.state.userNotOwnedAuctionIds[this.state.userNotOwnedAuctions.indexOf(auction)] + 1 } }}>
                                            <a><span className="pl-2 border flex bg-slate-300 font-semibold">Auction Contract: {auction}</span>
                                                <AuctionPreview web3={this.state.web3Provider} id={this.state.userNotOwnedAuctionIds[this.state.userNotOwnedAuctions.indexOf(auction)]} contract={this.state.contract}></AuctionPreview></a></Link>
                                    </div>
                                ))}
                            </div>) : null}
                        </div>
                    </div>
                )}
            </div>
        )
    }
}