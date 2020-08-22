// ============ Contracts ============

// Token
// deployed first
const SPAMImplementation = artifacts.require("SPAMDelegate");
const SPAMProxy = artifacts.require("SPAMDelegator");

// Rs
// deployed second
const SPAMReserves = artifacts.require("SPAMReserves");
const SPAMRebaser = artifacts.require("SPAMRebaser");

// ============ Main Migration ============

const migration = async (deployer, network, accounts) => {
  await Promise.all([
    deployRs(deployer, network),
  ]);
};

module.exports = migration;

// ============ Deploy Functions ============


async function deployRs(deployer, network) {
  let reserveToken = "0xdF5e0e81Dff6FAF3A7e52BA697820c5e32D806A8";
  let uniswap_factory = "0x5C69bEe701ef814a2B6a3EDD4B1652CB9cc5aA6f";
  await deployer.deploy(SPAMReserves, reserveToken, SPAMProxy.address);
  await deployer.deploy(SPAMRebaser,
      SPAMProxy.address,
      reserveToken,
      uniswap_factory,
      SPAMReserves.address
  );
  let rebase = new web3.eth.Contract(SPAMRebaser.abi, SPAMRebaser.address);

  let pair = await rebase.methods.uniswap_pair().call();
  console.log(pair)
  let spam = await SPAMProxy.deployed();
  await spam._setRebaser(SPAMRebaser.address);
  let reserves = await SPAMReserves.deployed();
  await reserves._setRebaser(SPAMRebaser.address)
}
