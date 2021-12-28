import { useState, Component } from 'react';
import { create as ipfsHttpClient } from 'ipfs-http-client';
import Head from 'next/head';
import Alert from '../components/Alert';
import getWeb3 from '../components/getWeb3';

const client = ipfsHttpClient('https://ipfs.infura.io:5001/api/v0');
import contractAuctionListing from '../build/contracts/AuctionListing.json';



export default class CreateAuction extends Component {

    state = {
        alert1: null
    };

    componentDidMount = async () => {
        console.clear();
        const web3 = await getWeb3();

        if (web3 !== undefined && web3['_provider'].connected !== false) {
            const blockchainNetworkId = await web3.eth.net.getId().then(console.log);
            const user = await web3.eth.getAccounts()[0];
        } else {
            console.log("Could not connect to blockchain network. Are you running Ganache or Metamask?");
            var alert1 = <Alert type="danger">Could not detect blockchain network. Are you running Ganache or Metamask? </Alert>;
            this.setState({ alert1 });
        }

    }

    render() {
        return (
            <div className="pt-4">
                <Head>
                    <title>
                        Create Auction
                    </title>
                </Head>

                {this.state.alert1}

                <h1>PLACEHOLDER TEXT</h1>
            </div>
        )
    }

}
// export default function createAuction() {
//     async function fileHandle(event) {
//         const file = event.target.files[0];
//         try {
//             const added = await client.add(file, { progress: (data) => console.log(`Received: ${prog}`) });
//             const url = `https://ipfs.infura.io/ipfs/${added.path}`;
//             setFileUrl(url);
//         } catch (error) {
//             console.log('Error uploading file: ', error);
//         }
//     }

//     async function createAuctionedItem() {
//         const { name, condition, description } = formInput;
//         const data = JSON.stringify({ name, condition, description, image: fileUrl });

//         try {
//             const added = await client.add(data);
//             const url = `https://ipfs.infura.io/ipfs/${added.path}`;

//         } catch (error) {
//             console.log('Error ');
//         }

//     }

//     return (<div>
//         <Head>
//             <title>Create Auction</title>
//         </Head>
//         <Web3Component />
//         <h1>TEST</h1>
//     </div>)
// }


