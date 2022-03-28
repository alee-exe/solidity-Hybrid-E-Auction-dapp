import '../styles/globals.css';
import Head from 'next/head';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer'
import Alert from '../components/Alert';

function MyApp({ Component, pageProps }) {
  return (<>
    <Head>
      <title> Auction Dapp </title>
    </Head>

    <div className="container mx-auto pt-4">
      <Navbar />
      <Component {...pageProps} />
      <Footer />
    </div>
  </>)
}

export default MyApp;


