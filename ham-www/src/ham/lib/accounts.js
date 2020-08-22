import * as Types from './types.js';

export class Account {
  constructor(
    contracts,
    address
  ) {
    this.contracts = contracts;
    this.accountInfo = address;
    this.type = "";
    this.allocation = [];
    this.balances = {};
    this.status = "";
    this.approvals = {};
    this.walletInfo = {};
  }

  async getSPAMWalletBalance() {
    this.walletInfo["DAI"] = await this.contracts.spam.methods.balanceOf(this.accountInfo).call();
    return this.walletInfo["DAI"]
  }

  async getYCRVWalletBalance() {
    this.walletInfo["YCRV"] = await this.contracts.ycrv.methods.balanceOf(this.accountInfo).call();
    return this.walletInfo["YCRV"]
  }

  async getYFIWalletBalance() {
    this.walletInfo["YFI"] = await this.contracts.yfi.methods.balanceOf(this.accountInfo).call();
    return this.walletInfo["YFI"]
  }

  async getSNXWalletBalance() {
    this.walletInfo["SNX"] = await this.contracts.snx.methods.balanceOf(this.accountInfo).call();
    return this.walletInfo["SNX"] //Replaced from UNIAmpl like in other files.
  }

  async getWETHWalletBalance() {
    this.walletInfo["WETH"] = await this.contracts.weth.methods.balanceOf(this.accountInfo).call();
    return this.walletInfo["WETH"]
  }

  async getETHWalletBalance() {
    this.walletInfo["ETH"] = await this.contracts.web3.eth.getBalance(this.accountInfo);
    return this.walletInfo["ETH"]
  }
}
