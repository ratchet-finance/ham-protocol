import {
  Spam
} from "../index.js";
import * as Types from "../lib/types.js";
import {
  addressMap
} from "../lib/constants.js";
import {
  decimalToString,
  stringToDecimal
} from "../lib/Helpers.js"


export const spam = new Spam(
  "http://localhost:8545/",
  // "http://127.0.0.1:9545/",
  "1001",
  true, {
    defaultAccount: "",
    defaultConfirmations: 1,
    autoGasMultiplier: 1.5,
    testing: false,
    defaultGas: "6000000",
    defaultGasPrice: "1000000000000",
    accounts: [],
    ethereumNodeTimeout: 10000
  }
)
const oneEther = 10 ** 18;

describe("post-deployment", () => {
  let snapshotId;
  let user;

  beforeAll(async () => {
    const accounts = await spam.web3.eth.getAccounts();
    spam.addAccount(accounts[0]);
    user = accounts[0];
    snapshotId = await spam.testing.snapshot();
  });

  beforeEach(async () => {
    await spam.testing.resetEVM("0x2");
  });

  describe("supply ownership", () => {

    test("owner balance", async () => {
      let balance = await spam.contracts.spam.methods.balanceOf(user).call();
      expect(balance).toBe(spam.toBigN(7000000).times(spam.toBigN(10**18)).toString())
    });

    test("pool balances", async () => {
      let ycrv_balance = await spam.contracts.spam.methods.balanceOf(spam.contracts.ycrv_pool.options.address).call();

      expect(ycrv_balance).toBe(spam.toBigN(1500000).times(spam.toBigN(10**18)).times(spam.toBigN(1)).toString())

      let yfi_balance = await spam.contracts.spam.methods.balanceOf(spam.contracts.yfi_pool.options.address).call();

      expect(yfi_balance).toBe(spam.toBigN(250000).times(spam.toBigN(10**18)).times(spam.toBigN(1)).toString())

      let dai_balance = await spam.contracts.spam.methods.balanceOf(spam.contracts.dai_pool.options.address).call();

      expect(dai_balance).toBe(spam.toBigN(250000).times(spam.toBigN(10**18)).times(spam.toBigN(1)).toString())

      let eth_balance = await spam.contracts.spam.methods.balanceOf(spam.contracts.eth_pool.options.address).call();

      expect(eth_balance).toBe(spam.toBigN(250000).times(spam.toBigN(10**18)).times(spam.toBigN(1)).toString())

      let snx_balance = await spam.contracts.spam.methods.balanceOf(spam.contracts.snx_pool.options.address).call();

      expect(snx_balance).toBe(spam.toBigN(250000).times(spam.toBigN(10**18)).times(spam.toBigN(1)).toString())

      let lend_balance = await spam.contracts.spam.methods.balanceOf(spam.contracts.lend_pool.options.address).call();

      expect(lend_balance).toBe(spam.toBigN(250000).times(spam.toBigN(10**18)).times(spam.toBigN(1)).toString())

      let link_balance = await spam.contracts.spam.methods.balanceOf(spam.contracts.link_pool.options.address).call();

      expect(link_balance).toBe(spam.toBigN(250000).times(spam.toBigN(10**18)).times(spam.toBigN(1)).toString())


    });

    test("total supply", async () => {
      let ts = await spam.contracts.spam.methods.totalSupply().call();
      expect(ts).toBe("10500000000000000000000000")
    });

    test("init supply", async () => {
      let init_s = await spam.contracts.spam.methods.initSupply().call();
      expect(init_s).toBe("10500000000000000000000000000000")
    });
  });

  describe("contract ownership", () => {

    test("spam gov", async () => {
      let gov = await spam.contracts.spam.methods.gov().call();
      expect(gov).toBe(spam.contracts.timelock.options.address)
    });

    test("rebaser gov", async () => {
      let gov = await spam.contracts.rebaser.methods.gov().call();
      expect(gov).toBe(spam.contracts.timelock.options.address)
    });

    test("reserves gov", async () => {
      let gov = await spam.contracts.reserves.methods.gov().call();
      expect(gov).toBe(spam.contracts.timelock.options.address)
    });

    test("timelock admin", async () => {
      let gov = await spam.contracts.timelock.methods.admin().call();
      expect(gov).toBe(spam.contracts.gov.options.address)
    });

    test("gov timelock", async () => {
      let tl = await spam.contracts.gov.methods.timelock().call();
      expect(tl).toBe(spam.contracts.timelock.options.address)
    });

    test("gov guardian", async () => {
      let grd = await spam.contracts.gov.methods.guardian().call();
      expect(grd).toBe("0x0000000000000000000000000000000000000000")
    });

    test("pool owner", async () => {
      let owner = await spam.contracts.eth_pool.methods.owner().call();
      expect(owner).toBe(spam.contracts.timelock.options.address)
    });

    test("incentives owner", async () => {
      let owner = await spam.contracts.ycrv_pool.methods.owner().call();
      expect(owner).toBe(spam.contracts.timelock.options.address)
    });

    test("pool rewarder", async () => {
      let rewarder = await spam.contracts.eth_pool.methods.rewardDistribution().call();
      expect(rewarder).toBe(spam.contracts.timelock.options.address)
    });
  });

  describe("timelock delay initiated", () => {
    test("timelock delay initiated", async () => {
      let inited = await spam.contracts.timelock.methods.admin_initialized().call();
      expect(inited).toBe(true);
    })
  })
})
