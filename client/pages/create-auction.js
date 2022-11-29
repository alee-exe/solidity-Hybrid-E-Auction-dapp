import { useState } from 'react';
import Alert from '../components/Alert';
import getWeb3 from '../components/getWeb3';
import Tooltip from '../components/Tooltip.js';
import { Web3Storage } from 'web3.storage';

// import local solidity smart contract "AuctionListing"
import AuctionListing from '../build/contracts/AuctionListing.json';

export default function CreateAuctionPage() {

    const [formField, updateFormField] = useState({ itemName: null, itemDescription: null, itemCondition: null, auctionDuration: null });
    const [ipfsImageHash, setIpfsImageHash] = useState(null);
    const [submitAlert, setSubmitAlert] = useState(null);

    async function createAuction(event) {
        event.preventDefault();
        const web3 = await getWeb3();
        const blockchainNetworkId = await web3.eth.net.getId();
        const contractAddress = await AuctionListing.networks[blockchainNetworkId].address;
        const contract = new web3.eth.Contract(AuctionListing['abi'], contractAddress);
        const userAddresses = await web3.eth.getAccounts();

        let { itemName, itemDescription, itemCondition, ownerContactDetails, auctionDuration, auctionSellingPrice, auctionBidIncrement, auctionStartingBid, auctionIsPrivate } = formField;

        if (auctionSellingPrice === undefined) {
            auctionSellingPrice = "0";
        }

        if (auctionBidIncrement === undefined) {
            auctionBidIncrement = "0";
        }

        if (auctionStartingBid === undefined) {
            auctionStartingBid = "0";
        }

        auctionSellingPrice = web3.utils.toWei(auctionSellingPrice, 'ether');
        auctionBidIncrement = web3.utils.toWei(auctionBidIncrement, 'ether');
        auctionStartingBid = web3.utils.toWei(auctionStartingBid, 'ether');

        contract.methods.createAuction(ownerContactDetails, auctionDuration, auctionSellingPrice, auctionBidIncrement, auctionStartingBid, auctionIsPrivate, itemName, itemDescription, itemCondition, ipfsImageHash).send({ from: userAddresses[0] }).then(async (response, error) => {
            if (!error) {
                console.log(response);
                setSubmitAlert(<Alert type="success">Successfully created Auction!</Alert>);
            } else {
                console.log(error);
                setSubmitAlert(<Alert type="danger">Error: Could not create Auction. See console for details.</Alert>);
            }
        });
    };

    async function handleImageFile(event) {
        const client = new Web3Storage({ token: process.env.WEB3_STORAGE_API_TOKEN });
        const imageFile = event.target.files;
        const files = [...imageFile].filter(f => f.type.includes('image'));
        const cid = await client.put(files);

        console.log('stored files with cid:', cid);
        const imageHashUrl = cid + '/' + imageFile.name;
        console.log(imageHashUrl);

        setIpfsImageHash(imageHashUrl);

        return imageHashUrl;
    };

    return (
        <div>
            {submitAlert}
            <form onSubmit={createAuction} className="flex justify-center pt-10 border">
                <div className="w-1/2 flex flex-col pb-12">
                    <h1 className="pb-3 text-2xl font-bold">Create an Auction</h1>
                    <hr className="border-slate-400 pb-4" />

                    <h1 className="pb-3 font-bold">Auctioned Item Properties</h1>
                    <div className="flex">Item Name: <Tooltip header="Item Name" message="Provide the name of your item to be auctioned. Limited to 50 characters maximum." ></Tooltip></div>
                    <input placeholder="Insert Item Name" maxLength="50" className="mt-1 border rounded p-2 mb-3" onChange={event => updateFormField({ ...formField, itemName: event.target.value })} required />
                    <div className="flex">Item Description: <Tooltip header="Item Description" message="Provide an in-depth description of your item. Limited to 500 characters maximum." ></Tooltip></div>
                    <textarea placeholder="Insert Item Description" maxLength="500" className="mt-1 border rounded p-2 mb-3" onChange={event => updateFormField({ ...formField, itemDescription: event.target.value })} required />
                    <div className="flex">Item Condition: <Tooltip maxLength="150" header="Item Condition" message="Provide the wear and condition of your item (e.g., Factory New, Second-hand etc.). Limited to 150 characters maximum." ></Tooltip></div>
                    <input placeholder="Insert Item Condition" className="mt-1 border rounded p-2 mb-3" onChange={event => updateFormField({ ...formField, itemCondition: event.target.value })} required />
                    <div className="flex">Item Image: <Tooltip header="Item Image" message="Provide an image file of your item. Only accepts image file types such as JPEG, PNG, GIF etc. Limited to 50 characters maximum." ></Tooltip></div>
                    <input type="file" accept="image/*" name="Upload Image" className="mt-1 border rounded p-2 mb-8" onChange={handleImageFile} required />

                    <h1 className="pb-3 font-bold">Your Contact Information</h1>
                    <div className="flex">Contact Details: <Tooltip maxLength="100" header="Contact Details" message="Provide your contact information such as telephone or email for the deliverance of promised goods. Limited to 100 characters maximum." ></Tooltip></div>
                    <input placeholder="E.g, Tel: 123123, Email: placeholder@email.com" className="mt-1 border rounded p-2 mb-8" onChange={event => updateFormField({ ...formField, ownerContactDetails: event.target.value })} required />

                    <h1 className="pb-3 font-bold">Auction Properties</h1>
                    <div className="flex">Auction Duration (in Hours): <Tooltip header="Auction Duration" message="Specify the auction duration (i.e., the countdown duration for the auction timer) in hours." ></Tooltip></div>
                    <input type="number" min="0" placeholder="Insert Duration" className="pt-2 mt-1 border rounded p-2 mb-3" onChange={event => updateFormField({ ...formField, auctionDuration: event.target.value })} required />
                    <div className="flex">Selling Price (Optional):<Tooltip header="Selling Price (Optional)" message="If you want bidders to be able to purchase your Auction Contract (i.e., directly buyout the auctioned item), then set a buyout price in ETH. Default value is 0 (No Selling Price)." ></Tooltip></div>
                    <input type="number" min="0" placeholder="Insert Selling Price (in ETH)" className="pt-2 mt-1 border rounded p-2 mb-3" onChange={event => updateFormField({ ...formField, auctionSellingPrice: event.target.value })} />
                    <div className="flex">Starting Bid (Optional):<Tooltip header="Starting Bid (Optional)" message="Specify the starting/minimum initial bid in ETH. Default value is 0 (No Starting Bid)." ></Tooltip></div>
                    <input type="number" min="0" placeholder="Insert Starting Bid (in ETH)" className="pt-2 mt-1 border rounded p-2 mb-3" onChange={event => updateFormField({ ...formField, auctionStartingBid: event.target.value })} />
                    <div className="flex">Bid Increment (Optional):<Tooltip header="Bid Increment (Optional)" message="Specify the Bid Increment/Step for bids in ETH (i.e., the minimum bid interval for new bids). Default value is 0 (No Bid Increments)." ></Tooltip></div>
                    <input type="number" min="0" placeholder="Insert Bid Increment (in ETH)" className="pt-2 mt-1 border rounded p-2 mb-3" onChange={event => updateFormField({ ...formField, auctionBidIncrement: event.target.value })} />
                    <div className="flex">Private Auction:<Tooltip header="Public/Private Auction" message="Specify the type of Auction. Public is an Open-bid Auction that provides all bidding information to bidders whereas Private is a Single-round Sealed-bid Auction that provides limited bidding information to bidders until the Auction is expired. Default value is false (public). Both auctions follow a First-price variant (i.e., highest bidder pays their winning bid)." ></Tooltip></div>
                    <select className="pt-2 mt-1 border rounded p-2 mb-3" onChange={event => updateFormField({ ...formField, auctionIsPrivate: event.target.value })} required>
                        <option value="false">False</option>
                        <option value="true">True</option>
                    </select>

                    <button type="submit" className="font-bold mt-4 bg-blue-500 text-white rounded p-4 shadow-lg">
                        Create Auction
                    </button>
                </div>
            </form>
        </div>
    )
}


