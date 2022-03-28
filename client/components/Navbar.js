import Link from 'next/link';

export default function Navbar() {
    return (
        <div>
            <h1 className="text-4xl font-bold pb-4">Hybrid Variant Decentralized E-Auction</h1>
            <hr className="pb-4 border-slate-400" />

            <nav className="pb-4">
                <div className="flex mt-4">
                    <Link href="/">
                        <a className="mr-8 font-bold text-blue-500 text-lg">
                            Auction Listings
                        </a>
                    </Link>
                    <Link href="/create-auction">
                        <a className="mr-8 font-bold text-blue-500 text-lg">
                            Create Auction
                        </a>
                    </Link>
                    <Link href="/my-auction-activity">
                        <a className="mr-8 font-bold text-blue-500 text-lg">
                            My Auction Activity
                        </a>
                    </Link>
                    <Link href="/my-current-bids">
                        <a className="mr-8 font-bold text-blue-500 text-lg">
                            My Current Bids
                        </a>
                    </Link>
                    <Link href="/user-dashboard">
                        <a className="mr-8 font-bold text-blue-500 text-lg">
                            User Dashboard
                        </a>
                    </Link>
                </div>
            </nav>
            <hr className="border-slate-400" />
        </div>
    )
}

