import { useEffect, useState } from 'react';
import Image from 'next/image';

// Template for each auction in the auction listing

export default function Auction(props) {
    const {contract, id} = props;

    // Auction properties
    const [owner, setOwner] = useState(null);
    const [startBlockTimeStamp, setStartBlockTime] = useState(null);
    const [endBlockTimeStamp, setEndBlockTime] = useState(null);
    const [ipfsImageHash, setIpfsImageHash] = useState(null);
    const [highestBid, setHighestBid] = useState(null);
    const [highestBidder, setHighestBidder] = useState(null);
    const [auctionStatus, setAuctionStatus] = useState(null);

    // Item propeties
    const [itemName, setItemName] = useState(null);
    const [itemDescription, setItemDescription] = useState(null);
    const [itemCondition, setItemCondition] = useState(null);

    // renders on every frame to update real-time components
    // renders once using []

    // TO-DO: convert this page to component class
    useEffect(() => {
        const getMethods = async () => {
            const owner = await contract.methods.getOwner(id).call();
            const startBlockTimeStamp = await contract.methods.getStartBlockTimeStamp(id).call();
            const endBlockTimeStamp = await contract.methods.getEndBlockTimeStamp(id).call();
            const highestBid = await contract.methods.getHighestBid(id).call();
            const highestBidder = await contract.methods.getHighestBidder(id).call();
            const auctionStatus = await contract.methods.getAuctionStatus(id).call();

            const auctionedItem = await contract.methods.getAuctionedItem(id).call();
            const itemName = auctionedItem[0];
            const itemDescription = auctionedItem[1];
            const itemCondition = auctionedItem[2];
            const ipfsImageHash = auctionedItem[3];

            setOwner(owner);
            setStartBlockTime(startBlockTimeStamp);
            setEndBlockTime(endBlockTimeStamp);
            setIpfsImageHash(ipfsImageHash);
            setHighestBid(highestBid);
            setHighestBidder(highestBidder);
            setAuctionStatus(auctionStatus);

            setItemName(itemName);
            setItemDescription(itemDescription);
            setItemCondition(itemCondition);
        }
        getMethods();
    }, []);

    function convertTimestampToDate(timestamp) {
        // convert to JS timestamp in miliseconds from Unix timestamp in seconds since Unix epoch
        const date = new Date(timestamp * 1000);
        const conversion = date.getDate() + '/' + (date.getMonth()+1) + '/' + date.getFullYear() + " at " + date.getHours() + ":" + (date.getMinutes()<10?'0':'') + date.getMinutes();

        return conversion;
    }

    function enumStatus(enum_index) {
        const status = ["CANCELLED", "ONGOING"];
        return (status[enum_index]);
      }

    return (
        <div className="grid grid-rows-2 grid-flow-col gap-4 pb-4 border mb-4">
            <div className="row-span-3 pl-5 pt-5">
                {ipfsImageHash === null ? (<p>Loading image...</p>) : (<Image src={`https://ipfs.infura.io/ipfs/${ipfsImageHash}`} width={390} height={250}></Image>)}
            </div>

            <div className="row-span-2 col-span-2 pt-5 pr-2">
                <p><span className="font-bold">Auction Owner (Address): </span>{owner}</p>
                <p><span className="font-bold">Start Date: </span>{convertTimestampToDate(startBlockTimeStamp)}</p>
                <p><span className="font-bold">End Date: </span>{convertTimestampToDate(endBlockTimeStamp)}</p>
                <p><span className="font-bold">Current Highest Bidder (Address): </span>{highestBidder}</p>
                <p><span className="font-bold">Current Highest Bid: </span>{highestBid} ETH</p>
                <p><span className="font-bold">Auction Status: </span>{enumStatus(auctionStatus)}</p>

                <p><span className="font-bold">Item Name: </span>{itemName}</p>
                <p><span className="font-bold">Item Description: </span>{itemDescription}</p>
                <p><span className="font-bold">Item Condition: </span>{itemCondition}</p>
            </div>
        </div>
    )
}