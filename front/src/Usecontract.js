const { useState, useEffect } = require('react');
const ethers = require('ethers');
const { abi, contractAddress } = require('./contract_info');

class Usecontract {
  constructor(options) {
    this.contract = null;
    this.symbol = '';
    this.signer = options.signer;
  }

  // contract 연결 함수
  async connectContract() {
    try {
      this.contract = await new ethers.Contract(contractAddress, abi, this.signer);
      console.log(`Contract connected: ${contractAddress}`);
    } catch (error) {
      console.error('Error connecting to contract:', error);
    }
  };

  // 읽기 함수
  async readFunction() {
    try {
      const getSymbol = await this.contract.symbol();
      this.symbol = getSymbol;
      console.log('Symbol:', this.symbol);
    } catch (error) {
      console.error('Error reading from contract:', error);
    }
  };

  // 쓰기 함수
  async writeFunction(address, value) {
    try {
      const transaction = await this.contract.transfer(address, value);
      await transaction.wait();
      console.log('Transaction: ', transaction);
    } catch (error) {
      console.error('Error sending transaction:', error);
    }
  };
}

module.exports = Usecontract;