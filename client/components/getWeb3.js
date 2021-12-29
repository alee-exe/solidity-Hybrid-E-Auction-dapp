import Web3 from "web3";

export default async function getWeb3 () {
    let web3 = null;

    // Modern dapp browsers...
    if (window.ethereum) {
        web3 = new Web3(window.ethereum);
        console.log("Requesting user account access...")
        try {
            // Request account access - via metamask
            window.ethereum.request({ method: "eth_requestAccounts" });
            console.log("User granted account acccess.")
            
        } catch (error) {
            // User denied account access...
            console.error("User denied account access.")
        }
    }
    // Legacy dapp browsers...
    else if (window.web3) {
        web3 = new Web3(window.web3.currentProvider);
        console.log("Using legacy browser")
    }
    // If no injected web3 instance is detected, fall back to Ganache
    else {
        const provider = new Web3.providers.HttpProvider('http://localhost:8545');
        web3 = new Web3(provider);
        console.log("Using local blockchain provider.")
    }
    
    return web3;
}