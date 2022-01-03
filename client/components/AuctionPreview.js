import { Component } from 'react';
import Image from 'next/image';
import { convertTimestampToDate, enumStatus} from './AuctionUtils.js';

// Template for each auction in the auction listing
export default class AuctionPreviewComponent extends Component {

    constructor(props) {
        super(props);

        const { id, contract, web3} = props;

        this.state = {
            web3: web3,
            contract: contract,
            id: id,
            owner: null,
            startBlockTimeStamp: null,
            endBlockTimeStamp: null,
            highestBidder: null,
            highestBid: null,
            auctionStatus: null,
            itemName: null,
            itemDescription: null,
            itemCondition: null,
            ipfsImageHash: null
        };
    }

    componentDidMount = async () => {

        try {
            const contract = this.state.contract;
            const id = this.state.id;
            const web3 = this.state.web3;
            const owner = await contract.methods.getOwner(id).call();
            const startBlockTimeStamp = await contract.methods.getStartBlockTimeStamp(id).call();
            const endBlockTimeStamp = await contract.methods.getEndBlockTimeStamp(id).call();
            const highestBid = web3.utils.fromWei(await contract.methods.getHighestBid(id).call());

            const highestBidder = await contract.methods.getHighestBidder(id).call();
            const auctionStatus = await contract.methods.getAuctionStatus(id).call();

            const auctionedItem = await contract.methods.getAuctionedItem(id).call();
            const itemName = auctionedItem[0];
            const itemDescription = auctionedItem[1];
            const itemCondition = auctionedItem[2];
            const ipfsImageHash = auctionedItem[3];

            this.setState({ owner, startBlockTimeStamp, endBlockTimeStamp, highestBid, highestBidder, auctionStatus, itemName, itemDescription, itemCondition, ipfsImageHash });

        } catch (error) {
            console.log(error);
        };
    }

    render() {
        return (
            <div className="grid grid-rows-2 grid-flow-col gap-4 pb-4 border mb-4">
                <div className="row-span-3 pl-5 pt-5">
                    {this.state.ipfsImageHash === null ? (<p>Loading image...</p>) : (<Image src={`https://ipfs.infura.io/ipfs/${this.state.ipfsImageHash}`} width={390} height={250} priority={true}></Image>)}
                </div>

                <div className="row-span-2 col-span-2 pt-5 pr-2">
                    <p><span className="font-bold">Auction Owner (Address): </span>{this.state.owner}</p>
                    <p><span className="font-bold">Start Date: </span>{convertTimestampToDate(this.state.startBlockTimeStamp)}</p>
                    <p><span className="font-bold">End Date: </span>{convertTimestampToDate(this.state.endBlockTimeStamp)}</p>
                    <p><span className="font-bold">Current Highest Bidder (Address): </span>{this.state.highestBidder}</p>
                    <p><span className="font-bold">Current Highest Bid: </span>{this.state.highestBid} ETH</p>
                    <p><span className="font-bold">Auction Status: </span>{enumStatus(this.state.auctionStatus)}</p>

                    <p><span className="font-bold">Item Name: </span>{this.state.itemName}</p>
                    <p><span className="font-bold">Item Description: </span>{this.state.itemDescription}</p>
                    <p><span className="font-bold">Item Condition: </span>{this.state.itemCondition}</p>
                </div>
            </div>
        )
    };
}