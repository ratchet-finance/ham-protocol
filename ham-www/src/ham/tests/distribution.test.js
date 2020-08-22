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
    defaultGasPrice: "1",
    accounts: [],
    ethereumNodeTimeout: 10000
  }
)
const oneEther = 10 ** 18;

describe("Distribution", () => {
  let snapshotId;
  let user;
  let user2;
  let ycrv_account = "0x0eb4add4ba497357546da7f5d12d39587ca24606";
  let weth_account = "0xf9e11762d522ea29dd78178c9baf83b7b093aacc";
  let lend_account = "0x3b08aa814bea604917418a9f0907e7fc430e742c";
  let link_account = "0xbe6977e08d4479c0a6777539ae0e8fa27be4e9d6";
  let dai_account = "0xf37216a8ac034d08b4663108d7532dfcb44583ed"; //Dai replacing mkr. 
  let snx_account = "0xb696d629cd0a00560151a434f6b4478ad6c228d7";
  let yfi_account = "0x0eb4add4ba497357546da7f5d12d39587ca24606"; //I need to know if these addresses are real accounts being used or if they are generated for the test, dai is using mkrs old address as it's own (please delete this comment once solved).
  beforeAll(async () => {
    const accounts = await spam.web3.eth.getAccounts();
    spam.addAccount(accounts[0]);
    user = accounts[0];
    spam.addAccount(accounts[1]);
    user2 = accounts[1];
    snapshotId = await spam.testing.snapshot();
  });

  beforeEach(async () => {
    await spam.testing.resetEVM("0x2");
  });


//All ampl classes used in pool failures and incentivizer pool has been replaced by the snx equivalent, also there are time when "uni_ampl" is used, this has been replaced but their placements are indicated by comments "UNIAmpl" or "uni-ampl".
  describe("pool failures", () => {
    test("cant join pool 1s early", async () => {
      await spam.testing.resetEVM("0x2");
      let a = await spam.web3.eth.getBlock('latest');

      let starttime = await spam.contracts.eth_pool.methods.starttime().call();

      expect(spam.toBigN(a["timestamp"]).toNumber()).toBeLessThan(spam.toBigN(starttime).toNumber());

      //console.log("starttime", a["timestamp"], starttime);
      await spam.contracts.weth.methods.approve(spam.contracts.eth_pool.options.address, -1).send({from: user});

      await spam.testing.expectThrow(
        spam.contracts.eth_pool.methods.stake(
          spam.toBigN(200).times(spam.toBigN(10**18)).toString()
        ).send({
          from: user,
          gas: 300000
        })
      , "not start");


      a = await spam.web3.eth.getBlock('latest');

      starttime = await spam.contracts.snx_pool.methods.starttime().call();

      expect(spam.toBigN(a["timestamp"]).toNumber()).toBeLessThan(spam.toBigN(starttime).toNumber());

      //console.log("starttime", a["timestamp"], starttime);

      await spam.contracts.UNIAmpl.methods.approve(spam.contracts.snx_pool.options.address, -1).send({from: user});

      await spam.testing.expectThrow(spam.contracts.snx_pool.methods.stake(
        "5016536322915819"
      ).send({
        from: user,
        gas: 300000
      }), "not start");
    });

    test("cant join pool 2 early", async () => {

    });

    test("cant withdraw more than deposited", async () => {
      await spam.testing.resetEVM("0x2");
      let a = await spam.web3.eth.getBlock('latest');

      await spam.contracts.weth.methods.transfer(user, spam.toBigN(2000).times(spam.toBigN(10**18)).toString()).send({
        from: weth_account
      });
      await spam.contracts.snx.methods.transfer(user, "5000000000000000").send({ //UNIAmpl
        from: snx_account //uni_ampl
      });

      let starttime = await spam.contracts.eth_pool.methods.starttime().call();

      let waittime = starttime - a["timestamp"];
      if (waittime > 0) {
        await spam.testing.increaseTime(waittime);
      }

      await spam.contracts.weth.methods.approve(spam.contracts.eth_pool.options.address, -1).send({from: user});

      await spam.contracts.eth_pool.methods.stake(
        spam.toBigN(200).times(spam.toBigN(10**18)).toString()
      ).send({
        from: user,
        gas: 300000
      });

      await spam.contracts.snx.methods.approve(spam.contracts.snx_pool.options.address, -1).send({from: user}); //UNIAmpl

      await spam.contracts.snx_pool.methods.stake(
        "5000000000000000"
      ).send({
        from: user,
        gas: 300000
      });

      await spam.testing.expectThrow(spam.contracts.snx_pool.methods.withdraw(
        "5016536322915820"
      ).send({
        from: user,
        gas: 300000
      }), "");

      await spam.testing.expectThrow(spam.contracts.eth_pool.methods.withdraw(
        spam.toBigN(201).times(spam.toBigN(10**18)).toString()
      ).send({
        from: user,
        gas: 300000
      }), "");

    });
  });

  describe("incentivizer pool", () => {
    test("joining and exiting", async() => {
      await spam.testing.resetEVM("0x2");

      await spam.contracts.ycrv.methods.transfer(user, "12000000000000000000000000").send({
        from: ycrv_account
      });

      await spam.contracts.weth.methods.transfer(user, spam.toBigN(2000).times(spam.toBigN(10**18)).toString()).send({
        from: weth_account
      });

      let a = await spam.web3.eth.getBlock('latest');

      let starttime = await spam.contracts.eth_pool.methods.starttime().call();

      let waittime = starttime - a["timestamp"];
      if (waittime > 0) {
        await spam.testing.increaseTime(waittime);
      } else {
        console.log("late entry", waittime)
      }

      await spam.contracts.weth.methods.approve(spam.contracts.eth_pool.options.address, -1).send({from: user});

      await spam.contracts.eth_pool.methods.stake(
        "2000000000000000000000"
      ).send({
        from: user,
        gas: 300000
      });

      let earned = await spam.contracts.eth_pool.methods.earned(user).call();

      let rr = await spam.contracts.eth_pool.methods.rewardRate().call();

      let rpt = await spam.contracts.eth_pool.methods.rewardPerToken().call();
      //console.log(earned, rr, rpt);
      await spam.testing.increaseTime(86400);
      // await spam.testing.mineBlock();

      earned = await spam.contracts.eth_pool.methods.earned(user).call();

      rpt = await spam.contracts.eth_pool.methods.rewardPerToken().call();

      let ysf = await spam.contracts.spam.methods.spamsScalingFactor().call();

      console.log(earned, ysf, rpt);

      let j = await spam.contracts.eth_pool.methods.getReward().send({
        from: user,
        gas: 300000
      });

      let spam_bal = await spam.contracts.spam.methods.balanceOf(user).call()

      console.log("spam bal", spam_bal)
      // start rebasing
        //console.log("approve spam")
        await spam.contracts.spam.methods.approve(
          spam.contracts.uni_router.options.address,
          -1
        ).send({
          from: user,
          gas: 80000
        });
        //console.log("approve ycrv")
        await spam.contracts.ycrv.methods.approve(
          spam.contracts.uni_router.options.address,
          -1
        ).send({
          from: user,
          gas: 80000
        });

        let ycrv_bal = await spam.contracts.ycrv.methods.balanceOf(user).call()

        console.log("ycrv_bal bal", ycrv_bal)

        console.log("add liq/ create pool")
        await spam.contracts.uni_router.methods.addLiquidity(
          spam.contracts.spam.options.address,
          spam.contracts.ycrv.options.address,
          spam_bal,
          spam_bal,
          spam_bal,
          spam_bal,
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

        await spam.contracts.uni_pair.methods.approve(
          spam.contracts.ycrv_pool.options.address,
          -1
        ).send({
          from: user,
          gas: 300000
        });

        starttime = await spam.contracts.ycrv_pool.methods.starttime().call();

        a = await spam.web3.eth.getBlock('latest');

        waittime = starttime - a["timestamp"];
        if (waittime > 0) {
          await spam.testing.increaseTime(waittime);
        } else {
          console.log("late entry, pool 2", waittime) //"pool 2" is used here, the original file used ampl here instead of snx, so it must be made sure that the pool number does not need to be changed (delete comment once solved).
        }

        await spam.contracts.ycrv_pool.methods.stake(bal).send({from: user, gas: 400000});


        earned = await spam.contracts.snx_pool.methods.earned(user).call();

        rr = await spam.contracts.snx_pool.methods.rewardRate().call();

        rpt = await spam.contracts.snx_pool.methods.rewardPerToken().call();

        console.log(earned, rr, rpt);

        await spam.testing.increaseTime(625000 + 1000);

        earned = await spam.contracts.snx_pool.methods.earned(user).call();

        rr = await spam.contracts.snx_pool.methods.rewardRate().call();

        rpt = await spam.contracts.snx_pool.methods.rewardPerToken().call();

        console.log(earned, rr, rpt);

        await spam.contracts.ycrv_pool.methods.exit().send({from: user, gas: 400000});

        spam_bal = await spam.contracts.spam.methods.balanceOf(user).call();


        expect(spam.toBigN(spam_bal).toNumber()).toBeGreaterThan(0)
        console.log("spam bal after staking in pool 2", spam_bal); 
    });
  });

  describe("eth", () => {
    test("rewards from pool 1s eth", async () => {
        await spam.testing.resetEVM("0x2");

        await spam.contracts.weth.methods.transfer(user, spam.toBigN(2000).times(spam.toBigN(10**18)).toString()).send({
          from: weth_account
        });

        let a = await spam.web3.eth.getBlock('latest');

        let starttime = await spam.contracts.eth_pool.methods.starttime().call();

        let waittime = starttime - a["timestamp"];
        if (waittime > 0) {
          await spam.testing.increaseTime(waittime);
        } else {
          console.log("late entry", waittime)
        }

        await spam.contracts.weth.methods.approve(spam.contracts.eth_pool.options.address, -1).send({from: user});

        await spam.contracts.eth_pool.methods.stake(
          "2000000000000000000000"
        ).send({
          from: user,
          gas: 300000
        });

        let earned = await spam.contracts.eth_pool.methods.earned(user).call();

        let rr = await spam.contracts.eth_pool.methods.rewardRate().call();

        let rpt = await spam.contracts.eth_pool.methods.rewardPerToken().call();
        //console.log(earned, rr, rpt);
        await spam.testing.increaseTime(625000 + 100);
        // await spam.testing.mineBlock();

        earned = await spam.contracts.eth_pool.methods.earned(user).call();

        rpt = await spam.contracts.eth_pool.methods.rewardPerToken().call();

        let ysf = await spam.contracts.spam.methods.spamsScalingFactor().call();

        //console.log(earned, ysf, rpt);


        let spam_bal = await spam.contracts.spam.methods.balanceOf(user).call()

        let j = await spam.contracts.eth_pool.methods.exit().send({
          from: user,
          gas: 300000
        });

        //console.log(j.events)

        let weth_bal = await spam.contracts.weth.methods.balanceOf(user).call()

        expect(weth_bal).toBe("2000000000000000000000")


        let spam_bal2 = await spam.contracts.spam.methods.balanceOf(user).call()

        let two_fity = spam.toBigN(250).times(spam.toBigN(10**3)).times(spam.toBigN(10**18))
        expect(spam.toBigN(spam_bal2).minus(spam.toBigN(spam_bal)).toString()).toBe(two_fity.times(1).toString())
    });
    test("rewards from pool 1s eth with rebase", async () => {
        await spam.testing.resetEVM("0x2");

        await spam.contracts.ycrv.methods.transfer(user, "12000000000000000000000000").send({
          from: ycrv_account
        });

        await spam.contracts.weth.methods.transfer(user, spam.toBigN(2000).times(spam.toBigN(10**18)).toString()).send({
          from: weth_account
        });

        let a = await spam.web3.eth.getBlock('latest');

        let starttime = await spam.contracts.eth_pool.methods.starttime().call();

        let waittime = starttime - a["timestamp"];
        if (waittime > 0) {
          await spam.testing.increaseTime(waittime);
        } else {
          console.log("late entry", waittime)
        }

        await spam.contracts.weth.methods.approve(spam.contracts.eth_pool.options.address, -1).send({from: user});

        await spam.contracts.eth_pool.methods.stake(
          "2000000000000000000000"
        ).send({
          from: user,
          gas: 300000
        });

        let earned = await spam.contracts.eth_pool.methods.earned(user).call();

        let rr = await spam.contracts.eth_pool.methods.rewardRate().call();

        let rpt = await spam.contracts.eth_pool.methods.rewardPerToken().call();
        //console.log(earned, rr, rpt);
        await spam.testing.increaseTime(125000 + 100);
        // await spam.testing.mineBlock();

        earned = await spam.contracts.eth_pool.methods.earned(user).call();

        rpt = await spam.contracts.eth_pool.methods.rewardPerToken().call();

        let ysf = await spam.contracts.spam.methods.spamsScalingFactor().call();

        //console.log(earned, ysf, rpt);




        let j = await spam.contracts.eth_pool.methods.getReward().send({
          from: user,
          gas: 300000
        });

        let spam_bal = await spam.contracts.spam.methods.balanceOf(user).call()

        console.log("spam bal", spam_bal)
        // start rebasing
          //console.log("approve spam")
          await spam.contracts.spam.methods.approve(
            spam.contracts.uni_router.options.address,
            -1
          ).send({
            from: user,
            gas: 80000
          });
          //console.log("approve ycrv")
          await spam.contracts.ycrv.methods.approve(
            spam.contracts.uni_router.options.address,
            -1
          ).send({
            from: user,
            gas: 80000
          });

          let ycrv_bal = await spam.contracts.ycrv.methods.balanceOf(user).call()

          console.log("ycrv_bal bal", ycrv_bal)

          console.log("add liq/ create pool")
          await spam.contracts.uni_router.methods.addLiquidity(
            spam.contracts.spam.options.address,
            spam.contracts.ycrv.options.address,
            spam_bal,
            spam_bal,
            spam_bal,
            spam_bal,
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
          //console.log("init swap")
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

          // trade back for easier calcs later
          //console.log("swap 0")
          await spam.contracts.uni_router.methods.swapExactTokensForTokens(
            "10000000000000000",
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

          await spam.testing.increaseTime(43200);

          //console.log("init twap")
          await spam.contracts.rebaser.methods.init_twap().send({
            from: user,
            gas: 500000
          });

          //console.log("first swap")
          await spam.contracts.uni_router.methods.swapExactTokensForTokens(
            "1000000000000000000000",
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
          //console.log("second swap")
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

          a = await spam.web3.eth.getBlock('latest');

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

          let bal1 = await spam.contracts.spam.methods.balanceOf(user).call();

          let resSPAM = await spam.contracts.spam.methods.balanceOf(spam.contracts.reserves.options.address).call();

          let resycrv = await spam.contracts.ycrv.methods.balanceOf(spam.contracts.reserves.options.address).call();

          // new balance > old balance
          expect(spam.toBigN(bal).toNumber()).toBeLessThan(spam.toBigN(bal1).toNumber());
          // increases reserves
          expect(spam.toBigN(resycrv).toNumber()).toBeGreaterThan(0);

          r = await spam.contracts.uni_pair.methods.getReserves().call();
          q = await spam.contracts.uni_router.methods.quote(spam.toBigN(10**18).toString(), r[0], r[1]).call();
          console.log("quote", q);
          // not below peg
          expect(spam.toBigN(q).toNumber()).toBeGreaterThan(spam.toBigN(10**18).toNumber());


        await spam.testing.increaseTime(525000 + 100);


        j = await spam.contracts.eth_pool.methods.exit().send({
          from: user,
          gas: 300000
        });
        //console.log(j.events)

        let weth_bal = await spam.contracts.weth.methods.balanceOf(user).call()

        expect(weth_bal).toBe("2000000000000000000000")


        let spam_bal2 = await spam.contracts.spam.methods.balanceOf(user).call()

        let two_fity = spam.toBigN(250).times(spam.toBigN(10**3)).times(spam.toBigN(10**18))
        expect(
          spam.toBigN(spam_bal2).minus(spam.toBigN(spam_bal)).toNumber()
        ).toBeGreaterThan(two_fity.toNumber())
    });
    test("rewards from pool 1s eth with negative rebase", async () => {
        await spam.testing.resetEVM("0x2");

        await spam.contracts.ycrv.methods.transfer(user, "12000000000000000000000000").send({
          from: ycrv_account
        });

        await spam.contracts.weth.methods.transfer(user, spam.toBigN(2000).times(spam.toBigN(10**18)).toString()).send({
          from: weth_account
        });

        let a = await spam.web3.eth.getBlock('latest');

        let starttime = await spam.contracts.eth_pool.methods.starttime().call();

        let waittime = starttime - a["timestamp"];
        if (waittime > 0) {
          await spam.testing.increaseTime(waittime);
        } else {
          console.log("late entry", waittime)
        }

        await spam.contracts.weth.methods.approve(spam.contracts.eth_pool.options.address, -1).send({from: user});

        await spam.contracts.eth_pool.methods.stake(
          "2000000000000000000000"
        ).send({
          from: user,
          gas: 300000
        });

        let earned = await spam.contracts.eth_pool.methods.earned(user).call();

        let rr = await spam.contracts.eth_pool.methods.rewardRate().call();

        let rpt = await spam.contracts.eth_pool.methods.rewardPerToken().call();
        //console.log(earned, rr, rpt);
        await spam.testing.increaseTime(125000 + 100);
        // await spam.testing.mineBlock();

        earned = await spam.contracts.eth_pool.methods.earned(user).call();

        rpt = await spam.contracts.eth_pool.methods.rewardPerToken().call();

        let ysf = await spam.contracts.spam.methods.spamsScalingFactor().call();

        //console.log(earned, ysf, rpt);




        let j = await spam.contracts.eth_pool.methods.getReward().send({
          from: user,
          gas: 300000
        });

        let spam_bal = await spam.contracts.spam.methods.balanceOf(user).call()

        console.log("spam bal", spam_bal)
        // start rebasing
          //console.log("approve spam")
          await spam.contracts.spam.methods.approve(
            spam.contracts.uni_router.options.address,
            -1
          ).send({
            from: user,
            gas: 80000
          });
          //console.log("approve ycrv")
          await spam.contracts.ycrv.methods.approve(
            spam.contracts.uni_router.options.address,
            -1
          ).send({
            from: user,
            gas: 80000
          });

          let ycrv_bal = await spam.contracts.ycrv.methods.balanceOf(user).call()

          console.log("ycrv_bal bal", ycrv_bal)

          spam_bal = spam.toBigN(spam_bal);
          console.log("add liq/ create pool")
          await spam.contracts.uni_router.methods.addLiquidity(
            spam.contracts.spam.options.address,
            spam.contracts.ycrv.options.address,
            spam_bal.times(.1).toString(),
            spam_bal.times(.1).toString(),
            spam_bal.times(.1).toString(),
            spam_bal.times(.1).toString(),
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
          //console.log("init swap")
          await spam.contracts.uni_router.methods.swapExactTokensForTokens(
            "1000000000000000000000",
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

          // trade back for easier calcs later
          //console.log("swap 0")
          await spam.contracts.uni_router.methods.swapExactTokensForTokens(
            "100000000000000",
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

          //console.log("init twap")
          await spam.contracts.rebaser.methods.init_twap().send({
            from: user,
            gas: 500000
          });

          //console.log("first swap")
          await spam.contracts.uni_router.methods.swapExactTokensForTokens(
            "100000000000000",
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
          //console.log("second swap")
          await spam.contracts.uni_router.methods.swapExactTokensForTokens(
            "1000000000000000000",
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

          a = await spam.web3.eth.getBlock('latest');

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

          let bal1 = await spam.contracts.spam.methods.balanceOf(user).call();

          let resSPAM = await spam.contracts.spam.methods.balanceOf(spam.contracts.reserves.options.address).call();

          let resycrv = await spam.contracts.ycrv.methods.balanceOf(spam.contracts.reserves.options.address).call();

          expect(spam.toBigN(bal1).toNumber()).toBeLessThan(spam.toBigN(bal).toNumber());
          expect(spam.toBigN(resycrv).toNumber()).toBe(0);

          r = await spam.contracts.uni_pair.methods.getReserves().call();
          q = await spam.contracts.uni_router.methods.quote(spam.toBigN(10**18).toString(), r[0], r[1]).call();
          console.log("quote", q);
          // not below peg
          expect(spam.toBigN(q).toNumber()).toBeLessThan(spam.toBigN(10**18).toNumber());


        await spam.testing.increaseTime(525000 + 100);


        j = await spam.contracts.eth_pool.methods.exit().send({
          from: user,
          gas: 300000
        });
        //console.log(j.events)

        let weth_bal = await spam.contracts.weth.methods.balanceOf(user).call()

        expect(weth_bal).toBe("2000000000000000000000")


        let spam_bal2 = await spam.contracts.spam.methods.balanceOf(user).call()

        let two_fity = spam.toBigN(250).times(spam.toBigN(10**3)).times(spam.toBigN(10**18))
        expect(
          spam.toBigN(spam_bal2).minus(spam.toBigN(spam_bal)).toNumber()
        ).toBeLessThan(two_fity.toNumber())
    });
  });

  describe("yfi", () => {
    test("rewards from pool 1s yfi", async () => {
        await spam.testing.resetEVM("0x2");
        await spam.contracts.yfi.methods.transfer(user, "500000000000000000000").send({
          from: yfi_account
        });

        let a = await spam.web3.eth.getBlock('latest');

        let starttime = await spam.contracts.yfi_pool.methods.starttime().call();

        let waittime = starttime - a["timestamp"];
        if (waittime > 0) {
          await spam.testing.increaseTime(waittime);
        } else {
          console.log("late entry", waittime)
        }

        await spam.contracts.yfi.methods.approve(spam.contracts.yfi_pool.options.address, -1).send({from: user});

        await spam.contracts.yfi_pool.methods.stake(
          "500000000000000000000"
        ).send({
          from: user,
          gas: 300000
        });

        let earned = await spam.contracts.yfi_pool.methods.earned(user).call();

        let rr = await spam.contracts.yfi_pool.methods.rewardRate().call();

        let rpt = await spam.contracts.yfi_pool.methods.rewardPerToken().call();
        //console.log(earned, rr, rpt);
        await spam.testing.increaseTime(625000 + 100);
        // await spam.testing.mineBlock();

        earned = await spam.contracts.yfi_pool.methods.earned(user).call();

        rpt = await spam.contracts.yfi_pool.methods.rewardPerToken().call();

        let ysf = await spam.contracts.spam.methods.spamsScalingFactor().call();

        //console.log(earned, ysf, rpt);


        let spam_bal = await spam.contracts.spam.methods.balanceOf(user).call()

        let j = await spam.contracts.yfi_pool.methods.exit().send({
          from: user,
          gas: 300000
        });

        //console.log(j.events)

        let weth_bal = await spam.contracts.yfi.methods.balanceOf(user).call()

        expect(weth_bal).toBe("500000000000000000000")


        let spam_bal2 = await spam.contracts.spam.methods.balanceOf(user).call()

        let two_fity = spam.toBigN(250).times(spam.toBigN(10**3)).times(spam.toBigN(10**18))
        expect(spam.toBigN(spam_bal2).minus(spam.toBigN(spam_bal)).toString()).toBe(two_fity.times(1).toString())
    });
  });

  describe("lend", () => {
    test("rewards from pool 1s lend", async () => {
        await spam.testing.resetEVM("0x2");
        await spam.web3.eth.sendTransaction({from: user2, to: lend_account, value : spam.toBigN(100000*10**18).toString()});

        await spam.contracts.lend.methods.transfer(user, "10000000000000000000000000").send({
          from: lend_account
        });

        let a = await spam.web3.eth.getBlock('latest');

        let starttime = await spam.contracts.lend_pool.methods.starttime().call();

        let waittime = starttime - a["timestamp"];
        if (waittime > 0) {
          await spam.testing.increaseTime(waittime);
        } else {
          console.log("late entry", waittime)
        }

        await spam.contracts.lend.methods.approve(spam.contracts.lend_pool.options.address, -1).send({from: user});

        await spam.contracts.lend_pool.methods.stake(
          "10000000000000000000000000"
        ).send({
          from: user,
          gas: 300000
        });

        let earned = await spam.contracts.lend_pool.methods.earned(user).call();

        let rr = await spam.contracts.lend_pool.methods.rewardRate().call();

        let rpt = await spam.contracts.lend_pool.methods.rewardPerToken().call();
        //console.log(earned, rr, rpt);
        await spam.testing.increaseTime(625000 + 100);
        // await spam.testing.mineBlock();

        earned = await spam.contracts.lend_pool.methods.earned(user).call();

        rpt = await spam.contracts.lend_pool.methods.rewardPerToken().call();

        let ysf = await spam.contracts.spam.methods.spamsScalingFactor().call();

        //console.log(earned, ysf, rpt);


        let spam_bal = await spam.contracts.spam.methods.balanceOf(user).call()

        let j = await spam.contracts.lend_pool.methods.exit().send({
          from: user,
          gas: 300000
        });

        //console.log(j.events)

        let weth_bal = await spam.contracts.lend.methods.balanceOf(user).call()

        expect(weth_bal).toBe("10000000000000000000000000")


        let spam_bal2 = await spam.contracts.spam.methods.balanceOf(user).call()

        let two_fity = spam.toBigN(250).times(spam.toBigN(10**3)).times(spam.toBigN(10**18))
        expect(spam.toBigN(spam_bal2).minus(spam.toBigN(spam_bal)).toString()).toBe(two_fity.times(1).toString())
    });
  });

  describe("link", () => {
    test("rewards from pool 1s link", async () => {
        await spam.testing.resetEVM("0x2");

        await spam.web3.eth.sendTransaction({from: user2, to: link_account, value : spam.toBigN(100000*10**18).toString()});

        await spam.contracts.link.methods.transfer(user, "10000000000000000000000000").send({
          from: link_account
        });

        let a = await spam.web3.eth.getBlock('latest');

        let starttime = await spam.contracts.link_pool.methods.starttime().call();

        let waittime = starttime - a["timestamp"];
        if (waittime > 0) {
          await spam.testing.increaseTime(waittime);
        } else {
          console.log("late entry", waittime)
        }

        await spam.contracts.link.methods.approve(spam.contracts.link_pool.options.address, -1).send({from: user});

        await spam.contracts.link_pool.methods.stake(
          "10000000000000000000000000"
        ).send({
          from: user,
          gas: 300000
        });

        let earned = await spam.contracts.link_pool.methods.earned(user).call();

        let rr = await spam.contracts.link_pool.methods.rewardRate().call();

        let rpt = await spam.contracts.link_pool.methods.rewardPerToken().call();
        //console.log(earned, rr, rpt);
        await spam.testing.increaseTime(625000 + 100);
        // await spam.testing.mineBlock();

        earned = await spam.contracts.link_pool.methods.earned(user).call();

        rpt = await spam.contracts.link_pool.methods.rewardPerToken().call();

        let ysf = await spam.contracts.spam.methods.spamsScalingFactor().call();

        //console.log(earned, ysf, rpt);


        let spam_bal = await spam.contracts.spam.methods.balanceOf(user).call()

        let j = await spam.contracts.link_pool.methods.exit().send({
          from: user,
          gas: 300000
        });

        //console.log(j.events)

        let weth_bal = await spam.contracts.link.methods.balanceOf(user).call()

        expect(weth_bal).toBe("10000000000000000000000000")


        let spam_bal2 = await spam.contracts.spam.methods.balanceOf(user).call()

        let two_fity = spam.toBigN(250).times(spam.toBigN(10**3)).times(spam.toBigN(10**18))
        expect(spam.toBigN(spam_bal2).minus(spam.toBigN(spam_bal)).toString()).toBe(two_fity.times(1).toString())
    });
  });

  describe("dai", () => {
    test("rewards from pool 1s mkr", async () => {
        await spam.testing.resetEVM("0x2");
        await spam.web3.eth.sendTransaction({from: user2, to: dai_account, value : spam.toBigN(100000*10**18).toString()});
        let eth_bal = await spam.web3.eth.getBalance(dai_account);

        await spam.contracts.dai.methods.transfer(user, "10000000000000000000000").send({
          from: dai_account
        });

        let a = await spam.web3.eth.getBlock('latest');

        let starttime = await spam.contracts.dai_pool.methods.starttime().call();

        let waittime = starttime - a["timestamp"];
        if (waittime > 0) {
          await spam.testing.increaseTime(waittime);
        } else {
          console.log("late entry", waittime)
        }

        await spam.contracts.dai.methods.approve(spam.contracts.dai_pool.options.address, -1).send({from: user});

        await spam.contracts.dai_pool.methods.stake(
          "10000000000000000000000"
        ).send({
          from: user,
          gas: 300000
        });

        let earned = await spam.contracts.dai_pool.methods.earned(user).call();

        let rr = await spam.contracts.dai_pool.methods.rewardRate().call();

        let rpt = await spam.contracts.dai_pool.methods.rewardPerToken().call();
        //console.log(earned, rr, rpt);
        await spam.testing.increaseTime(625000 + 100);
        // await spam.testing.mineBlock();

        earned = await spam.contracts.dai_pool.methods.earned(user).call();

        rpt = await spam.contracts.dai_pool.methods.rewardPerToken().call();

        let ysf = await spam.contracts.spam.methods.spamsScalingFactor().call();

        //console.log(earned, ysf, rpt);


        let spam_bal = await spam.contracts.spam.methods.balanceOf(user).call()

        let j = await spam.contracts.dai_pool.methods.exit().send({
          from: user,
          gas: 300000
        });

        //console.log(j.events)

        let weth_bal = await spam.contracts.dai.methods.balanceOf(user).call()

        expect(weth_bal).toBe("10000000000000000000000")


        let spam_bal2 = await spam.contracts.spam.methods.balanceOf(user).call()

        let two_fity = spam.toBigN(250).times(spam.toBigN(10**3)).times(spam.toBigN(10**18))
        expect(spam.toBigN(spam_bal2).minus(spam.toBigN(spam_bal)).toString()).toBe(two_fity.times(1).toString())
    });
  }); //dai replacing mkr

  describe("snx", () => {
    test("rewards from pool 1s snx", async () => {
        await spam.testing.resetEVM("0x2");

        await spam.web3.eth.sendTransaction({from: user2, to: snx_account, value : spam.toBigN(100000*10**18).toString()});

        let snx_bal = await spam.contracts.snx.methods.balanceOf(snx_account).call();

        console.log(snx_bal)

        await spam.contracts.snx.methods.transfer(user, snx_bal).send({
          from: snx_account
        });

        snx_bal = await spam.contracts.snx.methods.balanceOf(user).call();

        console.log(snx_bal)

        let a = await spam.web3.eth.getBlock('latest');

        let starttime = await spam.contracts.snx_pool.methods.starttime().call();

        let waittime = starttime - a["timestamp"];
        if (waittime > 0) {
          await spam.testing.increaseTime(waittime);
        } else {
          console.log("late entry", waittime)
        }

        await spam.contracts.snx.methods.approve(spam.contracts.snx_pool.options.address, -1).send({from: user});

        await spam.contracts.snx_pool.methods.stake(
          snx_bal
        ).send({
          from: user,
          gas: 300000
        });

        let earned = await spam.contracts.snx_pool.methods.earned(user).call();

        let rr = await spam.contracts.snx_pool.methods.rewardRate().call();

        let rpt = await spam.contracts.snx_pool.methods.rewardPerToken().call();
        //console.log(earned, rr, rpt);
        await spam.testing.increaseTime(625000 + 100);
        // await spam.testing.mineBlock();

        earned = await spam.contracts.snx_pool.methods.earned(user).call();

        rpt = await spam.contracts.snx_pool.methods.rewardPerToken().call();

        let ysf = await spam.contracts.spam.methods.spamsScalingFactor().call();

        //console.log(earned, ysf, rpt);


        let spam_bal = await spam.contracts.spam.methods.balanceOf(user).call()

        let j = await spam.contracts.snx_pool.methods.exit().send({
          from: user,
          gas: 300000
        });

        //console.log(j.events)

        let weth_bal = await spam.contracts.snx.methods.balanceOf(user).call()

        expect(weth_bal).toBe(snx_bal)


        let spam_bal2 = await spam.contracts.spam.methods.balanceOf(user).call()

        let two_fity = spam.toBigN(250).times(spam.toBigN(10**3)).times(spam.toBigN(10**18))
        expect(spam.toBigN(spam_bal2).minus(spam.toBigN(spam_bal)).toString()).toBe(two_fity.times(1).toString())
    });
  });
})
