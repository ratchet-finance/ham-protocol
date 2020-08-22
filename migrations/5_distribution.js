// ============ Contracts ============


// Protocol
// deployed second
const SPAMImplementation = artifacts.require("SPAMDelegate");
const SPAMProxy = artifacts.require("SPAMDelegator");

// deployed third
const SPAMReserves = artifacts.require("SPAMReserves");
const SPAMRebaser = artifacts.require("SPAMRebaser");

const Gov = artifacts.require("GovernorAlpha");
const Timelock = artifacts.require("Timelock");

// deployed fourth
const SPAM_ETHPool = artifacts.require("SPAMETHPool");
const SPAM_uAMPLPool = artifacts.require("SPAMAMPLPool");
const SPAM_YFIPool = artifacts.require("SPAMYFIPool");
const SPAM_LINKPool = artifacts.require("SPAMLINKPool");
const SPAM_MKRPool = artifacts.require("SPAMMKRPool");
const SPAM_LENDPool = artifacts.require("SPAMLENDPool");
const SPAM_COMPPool = artifacts.require("SPAMCOMPPool");
const SPAM_SNXPool = artifacts.require("SPAMSNXPool");


// deployed fifth
const SPAMIncentivizer = artifacts.require("SPAMIncentivizer");

// ============ Main Migration ============

const migration = async (deployer, network, accounts) => {
  await Promise.all([
    // deployTestContracts(deployer, network),
    deployDistribution(deployer, network, accounts),
    // deploySecondLayer(deployer, network)
  ]);
}

module.exports = migration;

// ============ Deploy Functions ============


async function deployDistribution(deployer, network, accounts) {
  console.log(network)
  let spam = await SPAMProxy.deployed();
  let yReserves = await SPAMReserves.deployed()
  let yRebaser = await SPAMRebaser.deployed()
  let tl = await Timelock.deployed();
  let gov = await Gov.deployed();
  if (network != "test") {
    await deployer.deploy(SPAM_ETHPool);
    await deployer.deploy(SPAM_uAMPLPool);
    await deployer.deploy(SPAM_YFIPool);
    await deployer.deploy(SPAMIncentivizer);
    await deployer.deploy(SPAM_LINKPool);
    await deployer.deploy(SPAM_MKRPool);
    await deployer.deploy(SPAM_LENDPool);
    await deployer.deploy(SPAM_COMPPool);
    await deployer.deploy(SPAM_SNXPool);

    let eth_pool = new web3.eth.Contract(SPAM_ETHPool.abi, SPAM_ETHPool.address);
    let ampl_pool = new web3.eth.Contract(SPAM_uAMPLPool.abi, SPAM_uAMPLPool.address);
    let yfi_pool = new web3.eth.Contract(SPAM_YFIPool.abi, SPAM_YFIPool.address);
    let lend_pool = new web3.eth.Contract(SPAM_LENDPool.abi, SPAM_LENDPool.address);
    let mkr_pool = new web3.eth.Contract(SPAM_MKRPool.abi, SPAM_MKRPool.address);
    let snx_pool = new web3.eth.Contract(SPAM_SNXPool.abi, SPAM_SNXPool.address);
    let comp_pool = new web3.eth.Contract(SPAM_COMPPool.abi, SPAM_COMPPool.address);
    let link_pool = new web3.eth.Contract(SPAM_LINKPool.abi, SPAM_LINKPool.address);
    let ycrv_pool = new web3.eth.Contract(SPAMIncentivizer.abi, SPAMIncentivizer.address);

    console.log("setting distributor");
    await Promise.all([
        eth_pool.methods.setRewardDistribution(accounts[0]).send({from: accounts[0], gas: 100000}),
        ampl_pool.methods.setRewardDistribution(accounts[0]).send({from: accounts[0], gas: 100000}),
        yfi_pool.methods.setRewardDistribution(accounts[0]).send({from: accounts[0], gas: 100000}),
        ycrv_pool.methods.setRewardDistribution(accounts[0]).send({from: accounts[0], gas: 100000}),
        lend_pool.methods.setRewardDistribution(accounts[0]).send({from: accounts[0], gas: 100000}),
        mkr_pool.methods.setRewardDistribution(accounts[0]).send({from: accounts[0], gas: 100000}),
        snx_pool.methods.setRewardDistribution(accounts[0]).send({from: accounts[0], gas: 100000}),
        comp_pool.methods.setRewardDistribution(accounts[0]).send({from: accounts[0], gas: 100000}),
        link_pool.methods.setRewardDistribution(accounts[0]).send({from: accounts[0], gas: 100000}),
        ycrv_pool.methods.setRewardDistribution(accounts[0]).send({from: accounts[0], gas: 100000}),
      ]);

    let two_fifty = web3.utils.toBN(10**3).mul(web3.utils.toBN(10**18)).mul(web3.utils.toBN(250));
    let one_five = two_fifty.mul(web3.utils.toBN(6));

    console.log("transfering and notifying");
    console.log("eth");
    await Promise.all([
      spam.transfer(SPAM_ETHPool.address, two_fifty.toString()),
      spam.transfer(SPAM_uAMPLPool.address, two_fifty.toString()),
      spam.transfer(SPAM_YFIPool.address, two_fifty.toString()),
      spam.transfer(SPAM_LENDPool.address, two_fifty.toString()),
      spam.transfer(SPAM_MKRPool.address, two_fifty.toString()),
      spam.transfer(SPAM_SNXPool.address, two_fifty.toString()),
      spam.transfer(SPAM_COMPPool.address, two_fifty.toString()),
      spam.transfer(SPAM_LINKPool.address, two_fifty.toString()),
      spam._setIncentivizer(SPAMIncentivizer.address),
    ]);

    await Promise.all([
      eth_pool.methods.notifyRewardAmount(two_fifty.toString()).send({from:accounts[0]}),
      ampl_pool.methods.notifyRewardAmount(two_fifty.toString()).send({from:accounts[0]}),
      yfi_pool.methods.notifyRewardAmount(two_fifty.toString()).send({from:accounts[0]}),
      lend_pool.methods.notifyRewardAmount(two_fifty.toString()).send({from:accounts[0]}),
      mkr_pool.methods.notifyRewardAmount(two_fifty.toString()).send({from:accounts[0]}),
      snx_pool.methods.notifyRewardAmount(two_fifty.toString()).send({from:accounts[0]}),
      comp_pool.methods.notifyRewardAmount(two_fifty.toString()).send({from:accounts[0]}),
      link_pool.methods.notifyRewardAmount(two_fifty.toString()).send({from:accounts[0]}),
      
      // incentives is a minter and prepopulates itself.
      ycrv_pool.methods.notifyRewardAmount("0").send({from: accounts[0], gas: 500000}),
    ]);

    await Promise.all([
      eth_pool.methods.setRewardDistribution(Timelock.address).send({from: accounts[0], gas: 100000}),
      ampl_pool.methods.setRewardDistribution(Timelock.address).send({from: accounts[0], gas: 100000}),
      yfi_pool.methods.setRewardDistribution(Timelock.address).send({from: accounts[0], gas: 100000}),
      lend_pool.methods.setRewardDistribution(Timelock.address).send({from: accounts[0], gas: 100000}),
      mkr_pool.methods.setRewardDistribution(Timelock.address).send({from: accounts[0], gas: 100000}),
      snx_pool.methods.setRewardDistribution(Timelock.address).send({from: accounts[0], gas: 100000}),
      comp_pool.methods.setRewardDistribution(Timelock.address).send({from: accounts[0], gas: 100000}),
      link_pool.methods.setRewardDistribution(Timelock.address).send({from: accounts[0], gas: 100000}),
      ycrv_pool.methods.setRewardDistribution(Timelock.address).send({from: accounts[0], gas: 100000}),
    ]);
    await Promise.all([
      eth_pool.methods.transferOwnership(Timelock.address).send({from: accounts[0], gas: 100000}),
      ampl_pool.methods.transferOwnership(Timelock.address).send({from: accounts[0], gas: 100000}),
      yfi_pool.methods.transferOwnership(Timelock.address).send({from: accounts[0], gas: 100000}),
      lend_pool.methods.transferOwnership(Timelock.address).send({from: accounts[0], gas: 100000}),
      mkr_pool.methods.transferOwnership(Timelock.address).send({from: accounts[0], gas: 100000}),
      snx_pool.methods.transferOwnership(Timelock.address).send({from: accounts[0], gas: 100000}),
      comp_pool.methods.transferOwnership(Timelock.address).send({from: accounts[0], gas: 100000}),
      link_pool.methods.transferOwnership(Timelock.address).send({from: accounts[0], gas: 100000}),
      ycrv_pool.methods.transferOwnership(Timelock.address).send({from: accounts[0], gas: 100000}),
    ]);
  }

  await Promise.all([
    spam._setPendingGov(Timelock.address),
    yReserves._setPendingGov(Timelock.address),
    yRebaser._setPendingGov(Timelock.address),
  ]);

  await Promise.all([
      tl.executeTransaction(
        SPAMProxy.address,
        0,
        "_acceptGov()",
        "0x",
        0
      ),

      tl.executeTransaction(
        SPAMReserves.address,
        0,
        "_acceptGov()",
        "0x",
        0
      ),

      tl.executeTransaction(
        SPAMRebaser.address,
        0,
        "_acceptGov()",
        "0x",
        0
      ),
  ]);
  await tl.setPendingAdmin(Gov.address);
  await gov.__acceptAdmin();
  await gov.__abdicate();
}
