import abi from '../utils/BuyMeACoffee.json';
import { ethers } from "ethers";
import Head from 'next/head'
import Image from 'next/image'
import React, { useEffect, useState } from "react";
import styles from '../styles/Home.module.css'

export default function Home() {
  // Contract Address & ABI
  const contractAddress = "0xe7De1288384d0Be146fD596928C86fCfc56bEfee";
  const contractABI = abi.abi;

  // Component state
  const [currentAccount, setCurrentAccount] = useState("");
  const [name, setName] = useState("");
  const [message, setMessage] = useState("");
  const [memos, setMemos] = useState([]);
  const [ownerConnected, setOwnerConnected] = useState();
  const [withdrawalAddressConnected, setWithdrawalAddressConnected] = useState();
  const [withdrawalAddress, setWithdrawalAddress] = useState();
  const [withdrawalAddressToRegister, setWithdrawalAddressToRegister] = useState();
  const [withdrawalAddressUpdatedList, setWithdrawalAddressUpdatedList] = useState([]);
  const [withdrawedList, setWithdrawedList] = useState([]);
  const [balance, setBalance] = useState("0");

  const onNameChange = (event) => {
    setName(event.target.value);
  }

  const onMessageChange = (event) => {
    setMessage(event.target.value);
  }

  const onWithdrawalAddressChange = (event) => {
    setWithdrawalAddressToRegister(event.target.value);
  }

  // Wallet connection logic
  const isWalletConnected = async () => {
    try {
      const { ethereum } = window;

      const accounts = await ethereum.request({ method: 'eth_accounts' })
      console.log("accounts: ", accounts);

      if (accounts.length > 0) {
        const account = accounts[0];
        console.log("wallet is connected! " + account);
      } else {
        console.log("make sure MetaMask is connected");
      }
    } catch (error) {
      console.log("error: ", error);
    }
  }

  // Wallet connection logic
  const isOwnerConnected = async () => {
    console.log("Start isOwnerConnected..");
    try {
      const { ethereum } = window;
      if (ethereum) {
        const provider = new ethers.providers.Web3Provider(ethereum);
        const signer = provider.getSigner();
        const buyMeACoffee = new ethers.Contract(
          contractAddress,
          contractABI,
          signer
        );
        const accounts = await ethereum.request({
          method: 'eth_requestAccounts'
        });
        console.log("getting owner from the blockchain..");
        const owner = await buyMeACoffee.owner();
        console.log("fetched owner: " + owner);
        console.log("connected address: " + accounts[0]);
        console.log("isOwner: " + accounts[0].toLowerCase() == owner.toLowerCase());
        setOwnerConnected(accounts[0].toLowerCase() == owner.toLowerCase());
      }
    } catch (error) {
      console.log(error);
    }
  }

  // withdrawal address
  const getWithdrawalAddress = async () => {
    console.log("Start isOwnerConnected..");
    try {
      const { ethereum } = window;
      if (ethereum) {
        const provider = new ethers.providers.Web3Provider(ethereum);
        const signer = provider.getSigner();
        const buyMeACoffee = new ethers.Contract(
          contractAddress,
          contractABI,
          signer
        );
        const accounts = await ethereum.request({
          method: 'eth_requestAccounts'
        });
        const withdrawal = await buyMeACoffee.withdrawalAddress();
        console.log("withdrawal address registred: " + withdrawal);
        setWithdrawalAddress(withdrawal);
        const isWithdrawalAddressConnected = accounts[0].toLowerCase() == withdrawal.toLowerCase();
        console.log("isWithdrawalAddressConnected: " + isWithdrawalAddressConnected);
        setWithdrawalAddressConnected(isWithdrawalAddressConnected);
      }
    } catch (error) {
      console.log(error);
    }
  }

  // withdrawal address
  const getBalance = async () => {
    try {
      const { ethereum } = window;
      if (ethereum) {
        const provider = new ethers.providers.Web3Provider(ethereum);
        const signer = provider.getSigner();
        const buyMeACoffee = new ethers.Contract(
          contractAddress,
          contractABI,
          signer
        );
        const contractBalanceWei = await buyMeACoffee.getBalance();
        const contractBalanceEth = ethers.utils.formatEther(contractBalanceWei);
        console.log("Balance: " + contractBalanceEth);
        setBalance(contractBalanceEth);
      }
    } catch (error) {
      console.log(error);
    }
  }

  const connectWallet = async () => {
    try {
      const { ethereum } = window;

      if (!ethereum) {
        console.log("please install MetaMask");
      }

      const accounts = await ethereum.request({
        method: 'eth_requestAccounts'
      });

      setCurrentAccount(accounts[0]);
      isOwnerConnected();
      getBalance();
    } catch (error) {
      console.log(error);
    }
  }

  const buyCoffee = async () => {
    try {
      const { ethereum } = window;

      if (ethereum) {
        const provider = new ethers.providers.Web3Provider(ethereum, "any");
        const signer = provider.getSigner();
        const buyMeACoffee = new ethers.Contract(
          contractAddress,
          contractABI,
          signer
        );

        console.log("buying coffee..")
        const coffeeTxn = await buyMeACoffee.buyCoffee(
          name ? name : "anon",
          message ? message : "Enjoy your coffee!",
          { value: ethers.utils.parseEther("0.001") }
        );

        await coffeeTxn.wait();

        console.log("mined ", coffeeTxn.hash);

        console.log("coffee purchased!");

        // Clear the form fields.
        setName("");
        setMessage("");
      }
    } catch (error) {
      console.log(error);
    }
  };

  const withdraw = async () => {
    try {
      const { ethereum } = window;

      if (ethereum) {
        const provider = new ethers.providers.Web3Provider(ethereum, "any");
        const signer = provider.getSigner();
        const buyMeACoffee = new ethers.Contract(
          contractAddress,
          contractABI,
          signer
        );

        console.log("withdraw")
        const coffeeTxn = await buyMeACoffee.withdrawTips();

        await coffeeTxn.wait();

        console.log("mined ", coffeeTxn.hash);

        console.log("withdraw done!");
      }
    } catch (error) {
      console.log(error);
    }
  };

  const updateWithdrawalAddress = async () => {
    try {
      const { ethereum } = window;

      if (ethereum && withdrawalAddressToRegister != "" && withdrawalAddressToRegister != "undefined") {
        const provider = new ethers.providers.Web3Provider(ethereum, "any");
        const signer = provider.getSigner();
        const buyMeACoffee = new ethers.Contract(
          contractAddress,
          contractABI,
          signer
        );

        console.log("updating withdrawal address ...");
        console.log("withdrawalAddressToRegister: " + withdrawalAddressToRegister);

        const coffeeTxn = await buyMeACoffee.updateWithdrawalAddress(
          withdrawalAddressToRegister
        );

        await coffeeTxn.wait();

        console.log("mined ", coffeeTxn.hash);

        console.log("withdrawal address updated!");

        // Clear the form fields.
        setWithdrawalAddressToRegister("");
      }
    } catch (error) {
      console.log(error);
    }
  };

  // Function to fetch all memos stored on-chain.
  const getMemos = async () => {
    try {
      const { ethereum } = window;
      if (ethereum) {
        const provider = new ethers.providers.Web3Provider(ethereum);
        const signer = provider.getSigner();
        const buyMeACoffee = new ethers.Contract(
          contractAddress,
          contractABI,
          signer
        );

        console.log("fetching memos from the blockchain..");
        const memos = await buyMeACoffee.getMemos();
        console.log("fetched!");
        setMemos(memos);
      } else {
        console.log("Metamask is not connected");
      }

    } catch (error) {
      console.log(error);
    }
  };

  useEffect(() => {
    let buyMeACoffee;
    isWalletConnected();
    //isOwnerConnected();
    getMemos();
    getWithdrawalAddress();
    getBalance();

    // Create an event handler function for when someone sends
    // us a new memo.
    const onNewMemo = (from, timestamp, name, message) => {
      console.log("Memo received: ", from, timestamp, name, message);
      setMemos((prevState) => [
        ...prevState,
        {
          address: from,
          timestamp: new Date(timestamp * 1000),
          message,
          name
        }
      ]);
      getBalance();
    };

    // Create an event handler function for when someone sends
    // us a withdrawalAddressUpdated.
    const onWithdrawalAddressUpdated = (oldAddress, newAddress) => {
      console.log("Memo received: ", oldAddress, newAddress);
      setWithdrawalAddressUpdatedList((prevState) => [
        ...prevState,
        {
          oldAddress: oldAddress,
          newAddress: newAddress
        }
      ]);
    };

    // Create an event handler function for when someone withdraw
    const onWithdrawed = (amount, withdrawer) => {
      console.log("Withdrawed received: ", ethers.utils.formatEther(amount), withdrawer);
      setWithdrawedList((prevState) => [
        ...prevState,
        {
          amount: ethers.utils.formatEther(amount),
          withdrawer: withdrawer
        }
      ]);
    };

    const { ethereum } = window;

    // Listen for new memo events.
    // Listen for withdrawal update events.
    // Listen for withdrawed events.
    if (ethereum) {
      const provider = new ethers.providers.Web3Provider(ethereum, "any");
      const signer = provider.getSigner();
      buyMeACoffee = new ethers.Contract(
        contractAddress,
        contractABI,
        signer
      );

      buyMeACoffee.on("NewMemo", onNewMemo);
      buyMeACoffee.on("withdrawalAddressUpdated", onWithdrawalAddressUpdated);
      buyMeACoffee.on("Withdrawed", onWithdrawed);
    }

    return () => {
      if (buyMeACoffee) {
        buyMeACoffee.off("NewMemo", onNewMemo);
      }
    }
  }, []);

  return (
    <div className={styles.container}>
      <Head>
        <title>Buy Moumou a Coffee!</title>
        <meta name="description" content="Tipping site" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <main className={styles.main}>
        <h1 className={styles.title}>
          Buy Moumou a Coffee!
        </h1>

        {currentAccount ? (
          <div>
            <form>
              <div>
                <label style={{ "fontWeight": "bold" }}>
                  Address connected:
                </label>
                <br />
                <p>{currentAccount}</p>
              </div>
            </form>
          </div>
        ) : (
            <br />
          )}

        {ownerConnected == true ? (
          <div>
            <form>
              <div>
                <label style={{ "fontWeight": "bold" }}>
                  Actual withdrawal address:
                </label>
                <br />
                <p>{withdrawalAddress}</p>
              </div>
              <br />
              <div>
                <label>
                  New withdrawal address
                </label>
                <br />
                <input
                  id="withdrawalAddressToRegister"
                  type="text"
                  placeholder="anon"
                  onChange={onWithdrawalAddressChange}
                />
                <br />
                <button
                  type="button"
                  onClick={updateWithdrawalAddress}
                >
                  Update withdrawal address
                </button>
              </div>
            </form>
          </div>
        ) : <br />}

        {currentAccount && withdrawalAddressConnected == true ? (
          <div>
            <form>
              <div>
                <label>
                  Balance:
                </label>
                <br />
                <p>{balance} eth</p>
              </div>
              <div>
                <button
                  type="button"
                  onClick={withdraw}
                >
                  Withdraw
                </button>
              </div>
            </form>
          </div>
        ) : <br />}

        {currentAccount ? (
          <div>
            <form>
              <div>
                <label>
                  Name
                </label>
                <br />

                <input
                  id="name"
                  type="text"
                  placeholder="anon"
                  onChange={onNameChange}
                />
              </div>
              <br />
              <div>
                <label>
                  Send Moumou a message
                </label>
                <br />

                <textarea
                  rows={3}
                  placeholder="Enjoy your coffee!"
                  id="message"
                  onChange={onMessageChange}
                  required
                >
                </textarea>
              </div>
              <div>
                <button
                  type="button"
                  onClick={buyCoffee}
                >
                  Send 1 Small Coffee for 0.001ETH
                </button>
              </div>
              <div>
                <button
                  type="button"
                  onClick={buyCoffee}
                >
                  Send 1 Large Coffee for 0.003ETH
                </button>
              </div>
            </form>
          </div>
        ) : (
            <button onClick={connectWallet}> Connect your wallet </button>
          )}
      </main>

      {currentAccount && (<h1>Memos received</h1>)}

      {currentAccount && (memos.map((memo, idx) => {
        return (
          <div key={idx} style={{ border: "2px solid", "borderRadius": "5px", padding: "5px", margin: "5px" }}>
            <p style={{ "fontWeight": "bold" }}>"{memo.message}"</p>
            <p>From: {memo.name} at {memo.timestamp.toString()}</p>
          </div>
        )
      }))}

      {currentAccount && (<h1>withdrawal Address Updated list</h1>)}

      {currentAccount && (withdrawalAddressUpdatedList.map((item, idx) => {
        return (
          <div key={idx} style={{ border: "2px solid", "borderRadius": "5px", padding: "5px", margin: "5px" }}>
            <p>Old address: {item.oldAddress}. New address: {item.newAddress}.</p>
          </div>
        )
      }))}

      {currentAccount && (<h1>withdrawing list</h1>)}

      {currentAccount && (withdrawedList.map((item, idx) => {
        return (
          <div key={idx} style={{ border: "2px solid", "borderRadius": "5px", padding: "5px", margin: "5px" }}>
            <p>Amount: {item.amount}. Withdrawer address: {item.withdrawer}.</p>
          </div>
        )
      }))}

      <footer className={styles.footer}>
        <a
          href="https://alchemy.com/?a=roadtoweb3weektwo"
          target="_blank"
          rel="noopener noreferrer"
        >
          Created by @raddmou99 for Alchemy's Road to Web3 lesson two!
        </a>
      </footer>
    </div>
  )
}
