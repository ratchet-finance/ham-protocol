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

describe("rebase_tests", () => {
  let snapshotId;
  let user;
  let new_user;
  // let unlocked_account = "0x0eb4add4ba497357546da7f5d12d39587ca24606";
  let unlocked_account = "0x681148725731f213b0187a3cbef215c291d85a3e";

  beforeAll(async () => {
    const accounts = await spam.web3.eth.getAccounts();
    spam.addAccount(accounts[0]);
    user = accounts[0];
    new_user = accounts[1];
    snapshotId = await spam.testing.snapshot();
  });

  beforeEach(async () => {
    await spam.testing.resetEVM("0x2");
    let a = await spam.contracts.ycrv.methods.transfer(user, "2000000000000000000000000").send({
      from: unlocked_account
    });
  });

  describe("rebase", () => {
    test("user has ycrv", async () => {
      let bal0 = await spam.contracts.ycrv.methods.balanceOf(user).call();
      expect(bal0).toBe("2000000000000000000000000");
    });
    test("create pair", async () => {
      await spam.contracts.uni_fact.methods.createPair(
        spam.contracts.ycrv.options.address,
        spam.contracts.spam.options.address
      ).send({
        from: user,
        gas: 8000000
      })
    });
    test("mint pair", async () => {
      await spam.contracts.spam.methods.approve(
        spam.contracts.uni_router.options.address,
        -1
      ).send({
        from: user,
        gas: 80000
      });
      await spam.contracts.ycrv.methods.approve(
        spam.contracts.uni_router.options.address,
        -1
      ).send({
        from: user,
        gas: 80000
      });

      await spam.contracts.uni_router.methods.addLiquidity(
        spam.contracts.spam.options.address,
        spam.contracts.ycrv.options.address,
        10000000,
        10000000,
        10000000,
        10000000,
        user,
        1596740361 + 100000000
      ).send({
        from: user,
        gas: 8000000
      });
      let pair = await spam.contracts.uni_fact.methods.getPair(
        spam.contracts.spam.options.address,
        spam.contracts.ycrv.options.address
      ).call();
      spam.contracts.uni_pair.options.address = pair;
      let bal = await spam.contracts.uni_pair.methods.balanceOf(user).call();
      expect(spam.toBigN(bal).toNumber()).toBeGreaterThan(100)
    });
    test("init_twap", async () => {
      await spam.contracts.spam.methods.approve(
        spam.contracts.uni_router.options.address,
        -1
      ).send({
        from: user,
        gas: 80000
      });
      await spam.contracts.ycrv.methods.approve(
        spam.contracts.uni_router.options.address,
        -1
      ).send({
        from: user,
        gas: 80000
      });

      await spam.contracts.uni_router.methods.addLiquidity(
        spam.contracts.spam.options.address,
        spam.contracts.ycrv.options.address,
        100000,
        100000,
        100000,
        100000,
        user,
        1596740361 + 10000000
      ).send({
        from: user,
        gas: 8000000
      });
      let pair = await spam.contracts.uni_fact.methods.getPair(
        spam.contracts.spam.options.address,
        spam.contracts.ycrv.options.address
      ).call();
      spam.contracts.uni_pair.options.address = pair;
      let bal = await spam.contracts.uni_pair.methods.balanceOf(user).call();

      // make a trade to get init values in uniswap
      await spam.contracts.uni_router.methods.swapExactTokensForTokens(
        1000,
        100,
        [
          spam.contracts.spam.options.address,
          spam.contracts.ycrv.options.address
        ],
        user,
        1596740361 + 10000000
      ).send({
        from: user,
        gas: 1000000
      });

      await spam.testing.increaseTime(1000);

      await spam.contracts.rebaser.methods.init_twap().send({
        from: user,
        gas: 500000
      });



      let init_twap = await spam.contracts.rebaser.methods.timeOfTWAPInit().call();
      let priceCumulativeLast = await spam.contracts.rebaser.methods.priceCumulativeLast().call();
      expect(spam.toBigN(init_twap).toNumber()).toBeGreaterThan(0);
      expect(spam.toBigN(priceCumulativeLast).toNumber()).toBeGreaterThan(0);
    });
    test("activate rebasing", async () => {
      await spam.contracts.spam.methods.approve(
        spam.contracts.uni_router.options.address,
        -1
      ).send({
        from: user,
        gas: 80000
      });
      await spam.contracts.ycrv.methods.approve(
        spam.contracts.uni_router.options.address,
        -1
      ).send({
        from: user,
        gas: 80000
      });

      await spam.contracts.uni_router.methods.addLiquidity(
        spam.contracts.spam.options.address,
        spam.contracts.ycrv.options.address,
        100000,
        100000,
        100000,
        100000,
        user,
        1596740361 + 10000000
      ).send({
        from: user,
        gas: 8000000
      });
      let pair = await spam.contracts.uni_fact.methods.getPair(
        spam.contracts.spam.options.address,
        spam.contracts.ycrv.options.address
      ).call();
      spam.contracts.uni_pair.options.address = pair;
      let bal = await spam.contracts.uni_pair.methods.balanceOf(user).call();

      // make a trade to get init values in uniswap
      await spam.contracts.uni_router.methods.swapExactTokensForTokens(
        1000,
        100,
        [
          spam.contracts.spam.options.address,
          spam.contracts.ycrv.options.address
        ],
        user,
        1596740361 + 10000000
      ).send({
        from: user,
        gas: 1000000
      });

      await spam.testing.increaseTime(1000);

      await spam.contracts.rebaser.methods.init_twap().send({
        from: user,
        gas: 500000
      });



      let init_twap = await spam.contracts.rebaser.methods.timeOfTWAPInit().call();
      let priceCumulativeLast = await spam.contracts.rebaser.methods.priceCumulativeLast().call();
      expect(spam.toBigN(init_twap).toNumber()).toBeGreaterThan(0);
      expect(spam.toBigN(priceCumulativeLast).toNumber()).toBeGreaterThan(0);

      await spam.testing.increaseTime(12 * 60 * 60);

      await spam.contracts.rebaser.methods.activate_rebasing().send({
        from: user,
        gas: 500000
      });
    });
    test("positive rebasing", async () => {
      await spam.contracts.spam.methods.approve(
        spam.contracts.uni_router.options.address,
        -1
      ).send({
        from: user,
        gas: 80000
      });
      await spam.contracts.ycrv.methods.approve(
        spam.contracts.uni_router.options.address,
        -1
      ).send({
        from: user,
        gas: 80000
      });

      await spam.contracts.uni_router.methods.addLiquidity(
        spam.contracts.spam.options.address,
        spam.contracts.ycrv.options.address,
        "1000000000000000000000000",
        "1000000000000000000000000",
        "1000000000000000000000000",
        "1000000000000000000000000",
        user,
        1596740361 + 10000000
      ).send({
        from: user,
        gas: 8000000
      });

      let pair = await spam.contracts.uni_fact.methods.getPair(
        spam.contracts.spam.options.address,
        spam.contracts.ycrv.options.address
      ).call();

      spam.contracts.uni_pair.options.address = pair;
      let bal = await spam.contracts.uni_pair.methods.balanceOf(user).call();

      // make a trade to get init values in uniswap
      await spam.contracts.uni_router.methods.swapExactTokensForTokens(
        "100000000000",
        100000,
        [
          spam.contracts.ycrv.options.address,
          spam.contracts.spam.options.address
        ],
        user,
        1596740361 + 10000000
      ).send({
        from: user,
        gas: 1000000
      });

      // trade back for easier calcs later
      await spam.contracts.uni_router.methods.swapExactTokensForTokens(
        "100000000000",
        100000,
        [
          spam.contracts.spam.options.address,
          spam.contracts.ycrv.options.address
        ],
        user,
        1596740361 + 10000000
      ).send({
        from: user,
        gas: 1000000
      });

      await spam.testing.increaseTime(43200);

      await spam.contracts.rebaser.methods.init_twap().send({
        from: user,
        gas: 500000
      });


      await spam.contracts.uni_router.methods.swapExactTokensForTokens(
        "100000000000000000000000",
        100000,
        [
          spam.contracts.ycrv.options.address,
          spam.contracts.spam.options.address
        ],
        user,
        1596740361 + 10000000
      ).send({
        from: user,
        gas: 1000000
      });

      // init twap
      let init_twap = await spam.contracts.rebaser.methods.timeOfTWAPInit().call();

      // wait 12 hours
      await spam.testing.increaseTime(12 * 60 * 60);

      // perform trade to change price
      await spam.contracts.uni_router.methods.swapExactTokensForTokens(
        "10000000000000000000",
        100000,
        [
          spam.contracts.ycrv.options.address,
          spam.contracts.spam.options.address
        ],
        user,
        1596740361 + 10000000
      ).send({
        from: user,
        gas: 1000000
      });

      // activate rebasing
      await spam.contracts.rebaser.methods.activate_rebasing().send({
        from: user,
        gas: 500000
      });


      let res_bal = await spam.contracts.spam.methods.balanceOf(
          spam.contracts.reserves.options.address
      ).call();

      expect(res_bal).toBe("0");

      bal = await spam.contracts.spam.methods.balanceOf(user).call();

      let a = await spam.web3.eth.getBlock('latest');

      let offset = await spam.contracts.rebaser.methods.rebaseWindowOffsetSec().call();
      offset = spam.toBigN(offset).toNumber();
      let interval = await spam.contracts.rebaser.methods.minRebaseTimeIntervalSec().call();
      interval = spam.toBigN(interval).toNumber();

      let i;
      if (a["timestamp"] % interval > offset) {
        i = (interval - (a["timestamp"] % interval)) + offset;
      } else {
        i = offset - (a["timestamp"] % interval);
      }

      await spam.testing.increaseTime(i);

      let r = await spam.contracts.uni_pair.methods.getReserves().call();
      let q = await spam.contracts.uni_router.methods.quote(spam.toBigN(10**18).toString(), r[0], r[1]).call();
      console.log("quote pre positive rebase", q);

      let b = await spam.contracts.rebaser.methods.rebase().send({
        from: user,
        gas: 2500000
      });

      //console.log(b.events)
      console.log("positive rebase gas used:", b["gasUsed"]);

      let bal1 = await spam.contracts.spam.methods.balanceOf(user).call();

      let resSPAM = await spam.contracts.spam.methods.balanceOf(spam.contracts.reserves.options.address).call();

      let resycrv = await spam.contracts.ycrv.methods.balanceOf(spam.contracts.reserves.options.address).call();

      console.log("bal user, bal spam res, bal res crv", bal1, resSPAM, resycrv);
      r = await spam.contracts.uni_pair.methods.getReserves().call();
      q = await spam.contracts.uni_router.methods.quote(spam.toBigN(10**18).toString(), r[0], r[1]).call();
      console.log("post positive rebase quote", q);

      // new balance > old balance
      expect(spam.toBigN(bal).toNumber()).toBeLessThan(spam.toBigN(bal1).toNumber());
      // used full spam reserves
      expect(spam.toBigN(resSPAM).toNumber()).toBe(0);
      // increases reserves
      expect(spam.toBigN(resycrv).toNumber()).toBeGreaterThan(0);


      // not below peg
      expect(spam.toBigN(q).toNumber()).toBeGreaterThan(spam.toBigN(10**18).toNumber());
    });
    test("negative rebasing", async () => {
      await spam.contracts.spam.methods.approve(
        spam.contracts.uni_router.options.address,
        -1
      ).send({
        from: user,
        gas: 80000
      });
      await spam.contracts.ycrv.methods.approve(
        spam.contracts.uni_router.options.address,
        -1
      ).send({
        from: user,
        gas: 80000
      });

      await spam.contracts.uni_router.methods.addLiquidity(
        spam.contracts.spam.options.address,
        spam.contracts.ycrv.options.address,
        "1000000000000000000000000",
        "1000000000000000000000000",
        "1000000000000000000000000",
        "1000000000000000000000000",
        user,
        1596740361 + 10000000
      ).send({
        from: user,
        gas: 8000000
      });

      let pair = await spam.contracts.uni_fact.methods.getPair(
        spam.contracts.spam.options.address,
        spam.contracts.ycrv.options.address
      ).call();

      spam.contracts.uni_pair.options.address = pair;
      let bal = await spam.contracts.uni_pair.methods.balanceOf(user).call();

      // make a trade to get init values in uniswap
      await spam.contracts.uni_router.methods.swapExactTokensForTokens(
        "100000000000",
        100000,
        [
          spam.contracts.ycrv.options.address,
          spam.contracts.spam.options.address
        ],
        user,
        1596740361 + 10000000
      ).send({
        from: user,
        gas: 1000000
      });

      // trade back for easier calcs later
      await spam.contracts.uni_router.methods.swapExactTokensForTokens(
        "100000000000",
        100000,
        [
          spam.contracts.spam.options.address,
          spam.contracts.ycrv.options.address
        ],
        user,
        1596740361 + 10000000
      ).send({
        from: user,
        gas: 1000000
      });

      await spam.testing.increaseTime(43200);

      await spam.contracts.rebaser.methods.init_twap().send({
        from: user,
        gas: 500000
      });


      await spam.contracts.uni_router.methods.swapExactTokensForTokens(
        "500000000000000000000000",
        100000,
        [
          spam.contracts.spam.options.address,
          spam.contracts.ycrv.options.address
        ],
        user,
        1596740361 + 10000000
      ).send({
        from: user,
        gas: 1000000
      });

      // init twap
      let init_twap = await spam.contracts.rebaser.methods.timeOfTWAPInit().call();

      // wait 12 hours
      await spam.testing.increaseTime(12 * 60 * 60);

      // perform trade to change price
      await spam.contracts.uni_router.methods.swapExactTokensForTokens(
        "10000000000000000000",
        100000,
        [
          spam.contracts.spam.options.address,
          spam.contracts.ycrv.options.address
        ],
        user,
        1596740361 + 10000000
      ).send({
        from: user,
        gas: 1000000
      });

      // activate rebasing
      await spam.contracts.rebaser.methods.activate_rebasing().send({
        from: user,
        gas: 500000
      });


      bal = await spam.contracts.spam.methods.balanceOf(user).call();

      let a = await spam.web3.eth.getBlock('latest');

      let offset = await spam.contracts.rebaser.methods.rebaseWindowOffsetSec().call();
      offset = spam.toBigN(offset).toNumber();
      let interval = await spam.contracts.rebaser.methods.minRebaseTimeIntervalSec().call();
      interval = spam.toBigN(interval).toNumber();

      let i;
      if (a["timestamp"] % interval > offset) {
        i = (interval - (a["timestamp"] % interval)) + offset;
      } else {
        i = offset - (a["timestamp"] % interval);
      }

      await spam.testing.increaseTime(i);

      let r = await spam.contracts.uni_pair.methods.getReserves().call();
      let q = await spam.contracts.uni_router.methods.quote(spam.toBigN(10**18).toString(), r[0], r[1]).call();
      console.log("quote pre negative rebase", q);

      let b = await spam.contracts.rebaser.methods.rebase().send({
        from: user,
        gas: 2500000
      });

      //console.log(b.events)
      console.log("negative rebase gas used:", b["gasUsed"]);

      let bal1 = await spam.contracts.spam.methods.balanceOf(user).call();

      let resSPAM = await spam.contracts.spam.methods.balanceOf(spam.contracts.reserves.options.address).call();

      let resycrv = await spam.contracts.ycrv.methods.balanceOf(spam.contracts.reserves.options.address).call();

      // balance decreases
      expect(spam.toBigN(bal1).toNumber()).toBeLessThan(spam.toBigN(bal).toNumber());
      // no increases to reserves
      expect(spam.toBigN(resSPAM).toNumber()).toBe(0);
      expect(spam.toBigN(resycrv).toNumber()).toBe(0);
    });
    test("no rebasing", async () => {
      await spam.contracts.spam.methods.approve(
        spam.contracts.uni_router.options.address,
        -1
      ).send({
        from: user,
        gas: 80000
      });
      await spam.contracts.ycrv.methods.approve(
        spam.contracts.uni_router.options.address,
        -1
      ).send({
        from: user,
        gas: 80000
      });

      await spam.contracts.uni_router.methods.addLiquidity(
        spam.contracts.spam.options.address,
        spam.contracts.ycrv.options.address,
        "1000000000000000000000000",
        "1000000000000000000000000",
        "1000000000000000000000000",
        "1000000000000000000000000",
        user,
        1596740361 + 10000000
      ).send({
        from: user,
        gas: 8000000
      });

      let pair = await spam.contracts.uni_fact.methods.getPair(
        spam.contracts.spam.options.address,
        spam.contracts.ycrv.options.address
      ).call();

      spam.contracts.uni_pair.options.address = pair;
      let bal = await spam.contracts.uni_pair.methods.balanceOf(user).call();

      // make a trade to get init values in uniswap
      await spam.contracts.uni_router.methods.swapExactTokensForTokens(
        "100000000000",
        100000,
        [
          spam.contracts.ycrv.options.address,
          spam.contracts.spam.options.address
        ],
        user,
        1596740361 + 10000000
      ).send({
        from: user,
        gas: 1000000
      });

      // trade back for easier calcs later
      await spam.contracts.uni_router.methods.swapExactTokensForTokens(
        "100000000000",
        100000,
        [
          spam.contracts.spam.options.address,
          spam.contracts.ycrv.options.address
        ],
        user,
        1596740361 + 10000000
      ).send({
        from: user,
        gas: 1000000
      });

      await spam.testing.increaseTime(43200);

      await spam.contracts.rebaser.methods.init_twap().send({
        from: user,
        gas: 500000
      });


      await spam.contracts.uni_router.methods.swapExactTokensForTokens(
        "10000000000000000000000",
        100000,
        [
          spam.contracts.spam.options.address,
          spam.contracts.ycrv.options.address
        ],
        user,
        1596740361 + 10000000
      ).send({
        from: user,
        gas: 1000000
      });

      await spam.contracts.uni_router.methods.swapExactTokensForTokens(
        "10000000000000000000000",
        100000,
        [
          spam.contracts.ycrv.options.address,
          spam.contracts.spam.options.address
        ],
        user,
        1596740361 + 10000000
      ).send({
        from: user,
        gas: 1000000
      });

      // init twap
      let init_twap = await spam.contracts.rebaser.methods.timeOfTWAPInit().call();

      // wait 12 hours
      await spam.testing.increaseTime(12 * 60 * 60);

      // perform trade to change price
      await spam.contracts.uni_router.methods.swapExactTokensForTokens(
        "10000000000000000000",
        100000,
        [
          spam.contracts.spam.options.address,
          spam.contracts.ycrv.options.address
        ],
        user,
        1596740361 + 10000000
      ).send({
        from: user,
        gas: 1000000
      });

      await spam.contracts.uni_router.methods.swapExactTokensForTokens(
        "10000000000000000000",
        100000,
        [
          spam.contracts.ycrv.options.address,
          spam.contracts.spam.options.address
        ],
        user,
        1596740361 + 10000000
      ).send({
        from: user,
        gas: 1000000
      });

      // activate rebasing
      await spam.contracts.rebaser.methods.activate_rebasing().send({
        from: user,
        gas: 500000
      });


      bal = await spam.contracts.spam.methods.balanceOf(user).call();

      let a = await spam.web3.eth.getBlock('latest');

      let offset = await spam.contracts.rebaser.methods.rebaseWindowOffsetSec().call();
      offset = spam.toBigN(offset).toNumber();
      let interval = await spam.contracts.rebaser.methods.minRebaseTimeIntervalSec().call();
      interval = spam.toBigN(interval).toNumber();

      let i;
      if (a["timestamp"] % interval > offset) {
        i = (interval - (a["timestamp"] % interval)) + offset;
      } else {
        i = offset - (a["timestamp"] % interval);
      }

      await spam.testing.increaseTime(i);

      let r = await spam.contracts.uni_pair.methods.getReserves().call();
      console.log(r, r[0], r[1]);
      let q = await spam.contracts.uni_router.methods.quote(spam.toBigN(10**18).toString(), r[0], r[1]).call();
      console.log("quote pre no rebase", q);
      let b = await spam.contracts.rebaser.methods.rebase().send({
        from: user,
        gas: 2500000
      });

      console.log("no rebase gas used:", b["gasUsed"]);

      let bal1 = await spam.contracts.spam.methods.balanceOf(user).call();

      let resSPAM = await spam.contracts.spam.methods.balanceOf(spam.contracts.reserves.options.address).call();

      let resycrv = await spam.contracts.ycrv.methods.balanceOf(spam.contracts.reserves.options.address).call();

      // no change
      expect(spam.toBigN(bal1).toNumber()).toBe(spam.toBigN(bal).toNumber());
      // no increases to reserves
      expect(spam.toBigN(resSPAM).toNumber()).toBe(0);
      expect(spam.toBigN(resycrv).toNumber()).toBe(0);
      r = await spam.contracts.uni_pair.methods.getReserves().call();
      q = await spam.contracts.uni_router.methods.quote(spam.toBigN(10**18).toString(), r[0], r[1]).call();
      console.log("quote post no rebase", q);
    });
    test("rebasing with SPAM in reserves", async () => {
      await spam.contracts.spam.methods.transfer(spam.contracts.reserves.options.address, spam.toBigN(60000*10**18).toString()).send({from: user});
      await spam.contracts.spam.methods.approve(
        spam.contracts.uni_router.options.address,
        -1
      ).send({
        from: user,
        gas: 80000
      });
      await spam.contracts.ycrv.methods.approve(
        spam.contracts.uni_router.options.address,
        -1
      ).send({
        from: user,
        gas: 80000
      });

      await spam.contracts.uni_router.methods.addLiquidity(
        spam.contracts.spam.options.address,
        spam.contracts.ycrv.options.address,
        "1000000000000000000000000",
        "1000000000000000000000000",
        "1000000000000000000000000",
        "1000000000000000000000000",
        user,
        1596740361 + 10000000
      ).send({
        from: user,
        gas: 8000000
      });

      let pair = await spam.contracts.uni_fact.methods.getPair(
        spam.contracts.spam.options.address,
        spam.contracts.ycrv.options.address
      ).call();

      spam.contracts.uni_pair.options.address = pair;
      let bal = await spam.contracts.uni_pair.methods.balanceOf(user).call();

      // make a trade to get init values in uniswap
      await spam.contracts.uni_router.methods.swapExactTokensForTokens(
        "100000000000",
        100000,
        [
          spam.contracts.ycrv.options.address,
          spam.contracts.spam.options.address
        ],
        user,
        1596740361 + 10000000
      ).send({
        from: user,
        gas: 1000000
      });

      // trade back for easier calcs later
      await spam.contracts.uni_router.methods.swapExactTokensForTokens(
        "100000000000",
        100000,
        [
          spam.contracts.spam.options.address,
          spam.contracts.ycrv.options.address
        ],
        user,
        1596740361 + 10000000
      ).send({
        from: user,
        gas: 1000000
      });

      await spam.testing.increaseTime(43200);

      await spam.contracts.rebaser.methods.init_twap().send({
        from: user,
        gas: 500000
      });


      await spam.contracts.uni_router.methods.swapExactTokensForTokens(
        "500000000000000000000000",
        100000,
        [
          spam.contracts.ycrv.options.address,
          spam.contracts.spam.options.address
        ],
        user,
        1596740361 + 10000000
      ).send({
        from: user,
        gas: 1000000
      });

      // init twap
      let init_twap = await spam.contracts.rebaser.methods.timeOfTWAPInit().call();

      // wait 12 hours
      await spam.testing.increaseTime(12 * 60 * 60);

      // perform trade to change price
      await spam.contracts.uni_router.methods.swapExactTokensForTokens(
        "10000000000000000000",
        100000,
        [
          spam.contracts.ycrv.options.address,
          spam.contracts.spam.options.address
        ],
        user,
        1596740361 + 10000000
      ).send({
        from: user,
        gas: 1000000
      });

      // activate rebasing
      await spam.contracts.rebaser.methods.activate_rebasing().send({
        from: user,
        gas: 500000
      });


      bal = await spam.contracts.spam.methods.balanceOf(user).call();

      let a = await spam.web3.eth.getBlock('latest');

      let offset = await spam.contracts.rebaser.methods.rebaseWindowOffsetSec().call();
      offset = spam.toBigN(offset).toNumber();
      let interval = await spam.contracts.rebaser.methods.minRebaseTimeIntervalSec().call();
      interval = spam.toBigN(interval).toNumber();

      let i;
      if (a["timestamp"] % interval > offset) {
        i = (interval - (a["timestamp"] % interval)) + offset;
      } else {
        i = offset - (a["timestamp"] % interval);
      }

      await spam.testing.increaseTime(i);


      let r = await spam.contracts.uni_pair.methods.getReserves().call();
      let q = await spam.contracts.uni_router.methods.quote(spam.toBigN(10**18).toString(), r[0], r[1]).call();
      console.log("quote pre pos rebase with reserves", q);

      let b = await spam.contracts.rebaser.methods.rebase().send({
        from: user,
        gas: 2500000
      });
      //console.log(b.events)

      console.log("positive  with reserves gas used:", b["gasUsed"]);

      let bal1 = await spam.contracts.spam.methods.balanceOf(user).call();

      let resSPAM = await spam.contracts.spam.methods.balanceOf(spam.contracts.reserves.options.address).call();

      let resycrv = await spam.contracts.ycrv.methods.balanceOf(spam.contracts.reserves.options.address).call();

      console.log(bal, bal1, resSPAM, resycrv);
      expect(spam.toBigN(bal).toNumber()).toBeLessThan(spam.toBigN(bal1).toNumber());
      expect(spam.toBigN(resSPAM).toNumber()).toBeGreaterThan(0);
      expect(spam.toBigN(resycrv).toNumber()).toBeGreaterThan(0);
      r = await spam.contracts.uni_pair.methods.getReserves().call();
      q = await spam.contracts.uni_router.methods.quote(spam.toBigN(10**18).toString(), r[0], r[1]).call();
      console.log("quote post rebase w/ reserves", q);
      expect(spam.toBigN(q).toNumber()).toBeGreaterThan(spam.toBigN(10**18).toNumber());
    });
  });

  describe("failing", () => {
    test("unitialized rebasing", async () => {
      await spam.testing.expectThrow(spam.contracts.rebaser.methods.activate_rebasing().send({
        from: user,
        gas: 500000
      }), "twap wasnt intitiated, call init_twap()");
    });
    test("no early twap", async () => {
      await spam.testing.expectThrow(spam.contracts.rebaser.methods.init_twap().send({
        from: user,
        gas: 500000
      }), "");
    });
    test("too late rebasing", async () => {
      await spam.contracts.spam.methods.approve(
        spam.contracts.uni_router.options.address,
        -1
      ).send({
        from: user,
        gas: 80000
      });
      await spam.contracts.ycrv.methods.approve(
        spam.contracts.uni_router.options.address,
        -1
      ).send({
        from: user,
        gas: 80000
      });

      await spam.contracts.uni_router.methods.addLiquidity(
        spam.contracts.spam.options.address,
        spam.contracts.ycrv.options.address,
        "1000000000000000000000000",
        "1000000000000000000000000",
        "1000000000000000000000000",
        "1000000000000000000000000",
        user,
        1596740361 + 10000000
      ).send({
        from: user,
        gas: 8000000
      });

      let pair = await spam.contracts.uni_fact.methods.getPair(
        spam.contracts.spam.options.address,
        spam.contracts.ycrv.options.address
      ).call();

      spam.contracts.uni_pair.options.address = pair;
      let bal = await spam.contracts.uni_pair.methods.balanceOf(user).call();

      // make a trade to get init values in uniswap
      await spam.contracts.uni_router.methods.swapExactTokensForTokens(
        "100000000000",
        100000,
        [
          spam.contracts.ycrv.options.address,
          spam.contracts.spam.options.address
        ],
        user,
        1596740361 + 10000000
      ).send({
        from: user,
        gas: 1000000
      });

      // trade back for easier calcs later
      await spam.contracts.uni_router.methods.swapExactTokensForTokens(
        "100000000000",
        100000,
        [
          spam.contracts.spam.options.address,
          spam.contracts.ycrv.options.address
        ],
        user,
        1596740361 + 10000000
      ).send({
        from: user,
        gas: 1000000
      });

      await spam.testing.increaseTime(43200);

      await spam.contracts.rebaser.methods.init_twap().send({
        from: user,
        gas: 500000
      });


      await spam.contracts.uni_router.methods.swapExactTokensForTokens(
        "500000000000000000000000",
        100000,
        [
          spam.contracts.ycrv.options.address,
          spam.contracts.spam.options.address
        ],
        user,
        1596740361 + 10000000
      ).send({
        from: user,
        gas: 1000000
      });

      // init twap
      let init_twap = await spam.contracts.rebaser.methods.timeOfTWAPInit().call();

      // wait 12 hours
      await spam.testing.increaseTime(12 * 60 * 60);

      // perform trade to change price
      await spam.contracts.uni_router.methods.swapExactTokensForTokens(
        "10000000000000000000",
        100000,
        [
          spam.contracts.ycrv.options.address,
          spam.contracts.spam.options.address
        ],
        user,
        1596740361 + 10000000
      ).send({
        from: user,
        gas: 1000000
      });

      // activate rebasing
      await spam.contracts.rebaser.methods.activate_rebasing().send({
        from: user,
        gas: 500000
      });


      bal = await spam.contracts.spam.methods.balanceOf(user).call();

      let a = await spam.web3.eth.getBlock('latest');

      let offset = await spam.contracts.rebaser.methods.rebaseWindowOffsetSec().call();
      offset = spam.toBigN(offset).toNumber();
      let interval = await spam.contracts.rebaser.methods.minRebaseTimeIntervalSec().call();
      interval = spam.toBigN(interval).toNumber();

      let i;
      if (a["timestamp"] % interval > offset) {
        i = (interval - (a["timestamp"] % interval)) + offset;
      } else {
        i = offset - (a["timestamp"] % interval);
      }

      let len = await spam.contracts.rebaser.methods.rebaseWindowLengthSec().call();

      await spam.testing.increaseTime(i + spam.toBigN(len).toNumber()+1);

      let b = await spam.testing.expectThrow(spam.contracts.rebaser.methods.rebase().send({
        from: user,
        gas: 2500000
      }), "too late");
    });
    test("too early rebasing", async () => {
      await spam.contracts.spam.methods.approve(
        spam.contracts.uni_router.options.address,
        -1
      ).send({
        from: user,
        gas: 80000
      });
      await spam.contracts.ycrv.methods.approve(
        spam.contracts.uni_router.options.address,
        -1
      ).send({
        from: user,
        gas: 80000
      });

      await spam.contracts.uni_router.methods.addLiquidity(
        spam.contracts.spam.options.address,
        spam.contracts.ycrv.options.address,
        "1000000000000000000000000",
        "1000000000000000000000000",
        "1000000000000000000000000",
        "1000000000000000000000000",
        user,
        1596740361 + 10000000
      ).send({
        from: user,
        gas: 8000000
      });

      let pair = await spam.contracts.uni_fact.methods.getPair(
        spam.contracts.spam.options.address,
        spam.contracts.ycrv.options.address
      ).call();

      spam.contracts.uni_pair.options.address = pair;
      let bal = await spam.contracts.uni_pair.methods.balanceOf(user).call();

      // make a trade to get init values in uniswap
      await spam.contracts.uni_router.methods.swapExactTokensForTokens(
        "100000000000",
        100000,
        [
          spam.contracts.ycrv.options.address,
          spam.contracts.spam.options.address
        ],
        user,
        1596740361 + 10000000
      ).send({
        from: user,
        gas: 1000000
      });

      // trade back for easier calcs later
      await spam.contracts.uni_router.methods.swapExactTokensForTokens(
        "100000000000",
        100000,
        [
          spam.contracts.spam.options.address,
          spam.contracts.ycrv.options.address
        ],
        user,
        1596740361 + 10000000
      ).send({
        from: user,
        gas: 1000000
      });

      await spam.testing.increaseTime(43200);

      await spam.contracts.rebaser.methods.init_twap().send({
        from: user,
        gas: 500000
      });


      await spam.contracts.uni_router.methods.swapExactTokensForTokens(
        "500000000000000000000000",
        100000,
        [
          spam.contracts.ycrv.options.address,
          spam.contracts.spam.options.address
        ],
        user,
        1596740361 + 10000000
      ).send({
        from: user,
        gas: 1000000
      });

      // init twap
      let init_twap = await spam.contracts.rebaser.methods.timeOfTWAPInit().call();

      // wait 12 hours
      await spam.testing.increaseTime(12 * 60 * 60);

      // perform trade to change price
      await spam.contracts.uni_router.methods.swapExactTokensForTokens(
        "10000000000000000000",
        100000,
        [
          spam.contracts.ycrv.options.address,
          spam.contracts.spam.options.address
        ],
        user,
        1596740361 + 10000000
      ).send({
        from: user,
        gas: 1000000
      });

      // activate rebasing
      await spam.contracts.rebaser.methods.activate_rebasing().send({
        from: user,
        gas: 500000
      });

      bal = await spam.contracts.spam.methods.balanceOf(user).call();

      let a = await spam.web3.eth.getBlock('latest');

      let offset = await spam.contracts.rebaser.methods.rebaseWindowOffsetSec().call();
      offset = spam.toBigN(offset).toNumber();
      let interval = await spam.contracts.rebaser.methods.minRebaseTimeIntervalSec().call();
      interval = spam.toBigN(interval).toNumber();

      let i;
      if (a["timestamp"] % interval > offset) {
        i = (interval - (a["timestamp"] % interval)) + offset;
      } else {
        i = offset - (a["timestamp"] % interval);
      }

      await spam.testing.increaseTime(i - 1);



      let b = await spam.testing.expectThrow(spam.contracts.rebaser.methods.rebase().send({
        from: user,
        gas: 2500000
      }), "too early");
    });
  });
});
