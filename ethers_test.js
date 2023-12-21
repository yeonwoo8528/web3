const ethers = require('ethers');
const dotenv = require('dotenv');
dotenv.config();
const alchemyApiKey = process.env.MUMBAI_API;
const provider = new ethers.JsonRpcProvider(alchemyApiKey);

const address = '0x3e4fF5Af77c0D375607DCBdb6939C5aE1fF9d955';

async function getBalance() {
  const balance = await provider.getBalance(address);
  console.log(`Balance: ${balance} MATIC`); //wei 단위
  console.log(`Balance: ${ethers.formatEther(balance)} MATIC`); // ether 단위 (10^18)
}

getBalance();
