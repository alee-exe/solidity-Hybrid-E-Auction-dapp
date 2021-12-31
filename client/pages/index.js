import React from 'react';
import Head from 'next/head';
import AuctionListingComponent from '../components/AuctionListing.js';

export default function Home() {
  return (
    <div>
      <Head>
        <title>Auction Dapp</title>
        <meta name="description" content="Decentralized E-Auction Dapp" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <AuctionListingComponent />
    </div>
  )
}