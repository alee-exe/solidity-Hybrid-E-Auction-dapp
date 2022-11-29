# Final Year Project - Hybrid Variant Decentralized E-Auction
Last Updated (29/11/2022).

This project aims to implement a fully decentralized blockchain based E-Auction system using Solidity smart contracts on the Ethereum platform to play the role of an auctioneer, to allow registered users via MetaMask to become buyers (bidders) and sellers (owners) in auctions.

This application then demonstrates a front-end user web interface to allow registered users to perform real-time simulation of bidding transactions and auction listings to the Ethereum blockchain as a proof-of-concept implementation for a fully smart contract-based E-Auction using DeFi for financial transactions.

This decentralized application is built-on the following technologies:
* Next.js/Node.js
* Web 3.0
* Truffle
* Ganache
* MetaMask
* Infura (Ropsten Testing ~~& IPFS P2P Network Storage~~)
* Web 3 Storage (IPFS P2P Decentralized Storage - Infura IPFS Public Gateway now deprecated and closed)

## Starting the Application
1. Clone the repository and install the necessary dependencies.
    ```
    git clone https://github.com/A0-Lee/solidity-Hybrid-E-Auction-dapp.git
    cd solidity-Hybrid-E-Auction-dapp
    npm install
    cd client
    npm install
    ```
2. Install and set-up [Ganache-UI](https://trufflesuite.com/docs/ganache/quickstart.html) for the local Ethereum blockchain (recommended) OR use [Ganache-CLI](https://docs.nethereum.com/en/latest/ethereum-and-clients/ganache-cli/). Create and configure a Ganache workspace by adding this Truffle project`s truffle-config.js (Port 8545, Network 5777).

3. Install Truffle via npm
    ```
    npm install -g truffle
    ```

4. Compile and deploy pre-written smart contracts locally via Truffle.
    ```
    truffle migrate
    ```

5. Create a [Web3 Storage](https://web3.storage) account and obtain your personal API Token to be placed in a .env.local file as WEB3_STORAGE_API_TOKEN.

6. Install [MetaMask](https://metamask.io/) for a chosen compatible web browser of your choice.

7. Connect Ganache to MetaMask by importing the generated mneomic wallet seed. Ensure the selected account's network is set to "Localhost 8545". Link any account from Ganache by using their private key through MetaMask`s import account feature.

8. Start the front-end application (http://localhost:3000).
    ```
    cd client
	npm run dev
    ```
## Deployment to Ropsten (Optional)
9. Set-up an [Infura](https://infura.io/) account to access public ETH nodes service network.

10. Configure Ropsten network settings in truffle-config.js (using your Ganache menomic seed and Infura Ethereum API for HDWalletProvider).

11. Compile and deploy smart contracts to public Ropsten testing network.
    ```
    truffle migrate --network ropsten
    ```

12. Switch the MetaMask account's network from "Localhost 8545" to "Ropsten Test Network" to use the public Ethereum testnet.

## Academic Note

This project was used for the submission of my final year dissertation and is thereby the recognised and respective property of the University of Surrey. 

Any attempts of academic submissions for university work using this publicly released project as is will be considered as plagiarism as per the university guidelines of misconduct and will result in severe penalties. 

Therefore, this project should only be used as an educational and informative proof-of-concept application or demonstration using modern blockchain and web technology. 