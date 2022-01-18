import { Component } from 'react';
import getWeb3 from '@/components/getWeb3.js';
import AuctionListing from '@/build/contracts/AuctionListing.json';

export default class UserDashboardPage extends Component {

    state = {
        web3Provider: null,
        userAccount: null,
        userWalletBalance: null
    };

    componentDidMount = async () => {
        try {
            const web3 = await getWeb3();
            const blockchainNetworkId = await web3.eth.net.getId();
            const contractAddress = await AuctionListing.networks[blockchainNetworkId].address;
            const contract = new web3.eth.Contract(AuctionListing['abi'], contractAddress);
            const userAddresses = await web3.eth.getAccounts();
            const userAccount = userAddresses[0];
            const userWalletBalance = await web3.eth.getBalance(userAccount);
            const userWalletBalanceToETH = web3.utils.fromWei(userWalletBalance, 'ether');

            this.setState({ web3Provider: web3, userAccount, userWalletBalance: userWalletBalanceToETH });
        } catch (error) {
            console.log(error);
        };
    }


    render() {
        return (
            <div className="border pl-20 pr-20 pt-10 pb-20">
                <h1 className="text-2xl font-bold pb-4"> User Dashboard </h1>
                <hr className="border-slate-400 pb-4" />
                <p><span className="font-bold">User Account Address: </span>{this.state.userAccount}</p>
                <p><span className="font-bold">User Wallet Balance: </span>{this.state.userWalletBalance} ETH</p>
            </div>
        )
    }
}