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
        contract: null
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

            this.setState({ auctionListing, web3Provider: web3, userAccount: userAddresses[0], contract });
        } catch (error) {
            console.log(error);
        };
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
                                <h1>Showing {this.state.auctionListing.length} auctions in total.</h1>
                            </div>

                            <div>
                                {this.state.auctionListing.map((auction, idx) => (
                                    <div key = {idx}>
                                        <Link href={{ pathname: this.ROUTE_AUCTION_ID, query: { id: idx + 1 } }}>
                                            <a><span className="pl-2 border flex bg-slate-300 font-semibold">Auction Contract: {auction}</span>
                                                <AuctionPreview web3={this.state.web3Provider} id={idx} contract={this.state.contract}></AuctionPreview></a></Link>
                                    </div>
                                ))}
                            </div>

                        </div>
                    </div>
                )}
            </div>
        )
    }
}