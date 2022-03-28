# Final Year Project - Hybrid Variant Decentralized E-Auction
This project aims to implement a decentralized blockchain based E-Auction system using Solidity smart contracts on the Ethereum platform to play the role of an auctioneer, to allow registered users via MetaMask to become buyers (bidders) and sellers (owners) in auctions.

This application then demonstrates a front-end user web interface to allow registered users to perform real-time simulation of bidding transactions and auction listings to the Ethereum blockchain as a proof-of-concept implementation for a fully smart contract-based E-Auction.

This decentralized application is built-on the following technologies:
* Next.js/Node.js
* Web 3.0
* Truffle
* Ganache
* MetaMask
* Infura (Ropsten Testing & IPFS P2P Network Storage)

## Starting the Application
1. Clone the repository and install the necessary dependencies.
    ```
    git clone https://github.com/A0-Lee/Decentralized-E-Auction.git
    cd Decentralized-E-Auction
    npm install
    cd client
    npm install
    ```
2. Install and set-up [Ganache-UI](https://trufflesuite.com/docs/ganache/quickstart.html) for the local Ethereum blockchain (recommended) OR use [Ganache-CLI](https://docs.nethereum.com/en/latest/ethereum-and-clients/ganache-cli/). Create and configure a Ganache workspace by adding this Truffle project`s truffle-config.js (Port 8545, Network 5777).

3. Compile and deploy smart contracts locally via Truffle.
    ```
    truffle migrate
    ```
4. Install [MetaMask](https://metamask.io/) for a chosen compatible browser of your choice.

5. Connect Ganache to MetaMask by importing the generated mneomic seed. Change account network to "Localhost 8545". Link each account using their private key through MetaMask`s import account feature.

6. Start the front-end application (http://localhost:3000).
    ```
    cd client
	npm run dev
    ```
## Deployment to Ropsten (Optional)
7. Set-up an [Infura](https://infura.io/) account to access public ETH nodes service network.

8. Configure Ropsten network settings in truffle-config.js (Ganache menomic seed and Infura Ethereum API for HDWalletProvider).

9. Compile and deploy smart contracts to public Ropsten testing network.
    ```
    truffle migrate --network ropsten
    ```

10. Switch MetaMask account network from "Localhost 8545" to "Ropsten Test Network".