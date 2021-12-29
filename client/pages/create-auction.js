import { useState, Component } from 'react';
import { create as ipfsHttpClient } from 'ipfs-http-client';
import Head from 'next/head';
import Alert from '../components/Alert';
import getWeb3 from '../components/getWeb3';

const client = ipfsHttpClient('https://ipfs.infura.io:5001/api/v0');
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

        const { itemName, itemDescription, itemCondition, auctionDuration } = formField;

        contract.methods.createAuction(auctionDuration, itemName, itemDescription, itemCondition, ipfsImageHash).send({ from: userAddresses[0] }).then(async (response, error) => {
            if(!error) {
                console.log(response);
                setSubmitAlert(<Alert type="success">Successfully created Auction!</Alert>);
            } else {
                setSubmitAlert(<Alert type="danger">Error: Could not create Auction.</Alert>);
            }
        });
    }


    async function handleImageFile(event) {
        const imageFile = event.target.files[0];
        try {
            const bind = await client.add(imageFile, { progress: (update) => console.log(`Successfully received uploaded file (bytes): ${update}`) });
            // const hostedFileImageUrl = `https://ipfs.infura.io/ipfs/${bind.path}`;
            console.log(bind.path);
            setIpfsImageHash(bind.path);
        } catch (error) {
            console.log("Error: could not handle selected file: ", error);
        }
    }

    return (
        <div>
            {submitAlert}
            <form onSubmit={createAuction} className="flex justify-center pt-10 border">
                <div className="w-1/2 flex flex-col pb-12">
                    <h1 className="pb-3 font-bold">Create an Auction</h1>
                    <hr className="border-slate-400 pb-4" />

                    <h1 className="pb-3 font-bold">Auctioned Item Properties</h1>
                    <p>Item Name: </p>
                    <input placeholder="Insert Item Name" className="mt-1 border rounded p-2 mb-3" onChange={event => updateFormField({ ...formField, itemName: event.target.value })} required />
                    <p>Item Description: </p>
                    <textarea placeholder="Insert Item Description" className="mt-1 border rounded p-2 mb-3" onChange={event => updateFormField({ ...formField, itemDescription: event.target.value })} required />
                    <p>Item Condition: </p>
                    <input placeholder="Insert Item Condition" className="mt-1 border rounded p-2 mb-3" onChange={event => updateFormField({ ...formField, itemCondition: event.target.value })} required />
                    <p>Item Image File: </p>
                    <input type="file" accept="image/*" name="Upload Image" className="mt-1 border rounded p-2 mb-8" onChange={handleImageFile} required />

                    <h1 className="pb-3 font-bold">Auction Properties</h1>
                    <p>Auction Duration (in Hours):</p>
                    <input placeholder="Insert Duration" className="pt-2 mt-1 border rounded p-2 mb-8" onChange={event => updateFormField({ ...formField, auctionDuration: event.target.value })} required />

                    <button type="submit" className="font-bold mt-4 bg-blue-500 text-white rounded p-4 shadow-lg">
                        Create Auction
                    </button>
                </div>
            </form>
        </div>
    )

}


