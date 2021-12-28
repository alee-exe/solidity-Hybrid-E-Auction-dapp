import '../styles/globals.css';
import Head from 'next/head';
import Navbar from '../components/Navbar';
import Alert from '../components/Alert';

function MyApp({ Component, pageProps }) {
  return (<>
    <Head>
      <title> Auction Dapp </title>
    </Head>

    <div className="container mx-auto pt-4">
      {/* <Alert type="success">This is a success message</Alert>
      <Alert type="warning">This is a warning message</Alert>
      <Alert type="danger">This is a danger message</Alert>
      <Alert type="any">This is an any message</Alert> */}
      <Navbar />
      <Component {...pageProps} />
    </div>
  </>)
}

// function MyApp( {Component, pageProps }) {
//   return (<Component {...pageProps} />)
// }

export default MyApp;


