// ============ Contracts ============

// Token
// deployed first
const SPAMImplementation = artifacts.require("SPAMDelegate");
const SPAMProxy = artifacts.require("SPAMDelegator");

// ============ Main Migration ============

const migration = async (deployer, network, accounts) => {
  await Promise.all([
    deployToken(deployer, network),
  ]);
};

module.exports = migration;

// ============ Deploy Functions ============


async function deployToken(deployer, network) {
  await deployer.deploy(SPAMImplementation);
  if (network != "mainnet") {
    await deployer.deploy(SPAMProxy,
      "SPAM",
      "SPAM",
      18,
      "9000000000000000000000000", // print extra few mil for user
      SPAMImplementation.address,
      "0x"
    );
  } else {
    await deployer.deploy(SPAMProxy,
      "SPAM",
      "SPAM",
      18,
      "2000000000000000000000000",
      SPAMImplementation.address,
      "0x"
    );
  }

}
