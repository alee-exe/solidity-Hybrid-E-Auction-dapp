import Link from 'next/link';

export default function Navbar() {
    return (
        <div>
            <h1 className="text-4xl font-bold pb-4">Decentralized Auction App</h1>
            <hr className="pb-4 border-slate-400" />

            <nav className="pb-4">
                <div className="flex mt-4">
                    <Link href="/">
                        <a className="mr-4 text-blue-500">
                            Auction Listings
                        </a>
                    </Link>
                    <Link href="/create-auction">
                        <a className="mr-6 text-blue-500">
                            Create Auction
                        </a>
                    </Link>
                    <Link href="/my-auction-history">
                        <a className="mr-6 text-blue-500">
                            My Auction History
                        </a>
                    </Link>
                    <Link href="/creator-dashboard">
                        <a className="mr-6 text-blue-500">
                            Creator Dashboard
                        </a>
                    </Link>
                </div>
            </nav>
            <hr className="border-slate-400" />
        </div>
    )
}

