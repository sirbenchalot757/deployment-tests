const Ramifi = artifacts.require("Ramifi");
const RamifiPolicy = artifacts.require("RamifiPolicy");
const Maestro = artifacts.require("Maestro");
const CommmodityOracle = artifacts.require("CommmodityOracle");
const TokenTorrent = artifacts.require("TokenTorrent");
const AdminUpgradeabilityProxy = artifacts.require("AdminUpgradeabilityProxy");
const ProxyAdmin = artifacts.require("ProxyAdmin");
const APIConsumer = artifacts.require("APIConsumer");
const OracleTWAP = artifacts.require("OracleTWAP");
const Bex = artifacts.require("Bex");
const GovernorAlpha = artifacts.require("GovernorAlpha");
const Timelock = artifacts.require("Timelock");
const UniswapV2Factory = artifacts.require("UniswapV2Factory");

async function deployContracts(deployer) {
  const deployerAddress = deployer.provider.addresses;

  const proxyAdmin = await deployer.deploy(ProxyAdmin);
  
  const callDataRamifi = "0xc4d66de8000000000000000000000000" + deployerAddress[0].substring(2);
  
  const ramifi = await deployer.deploy(Ramifi);
  const upgradableProxyRamifi = await deployer.deploy(AdminUpgradeabilityProxy, Ramifi.address,
    ProxyAdmin.address, callDataRamifi);

  const callDataRamifiPolicy = "0x1794bb3c000000000000000000000000" + deployerAddress[0].substring(2) + "000000000000000000000000" + (upgradableProxyRamifi.address).substring(2) + "00000000000000000000000000000000000000000000000000000000000009E6";
  const ramifiPolicy = await deployer.deploy(RamifiPolicy);
  const upgradableProxyRamifiPolicy = await deployer.deploy(AdminUpgradeabilityProxy, RamifiPolicy.address,
    ProxyAdmin.address, callDataRamifiPolicy);

  const uniFactory = await UniswapV2Factory.at("0x5c69bee701ef814a2b6a3edd4b1652cb9cc5aa6f");
  await uniFactory.createPair(upgradableProxyRamifi.address, "0x5c69bee701ef814a2b6a3edd4b1652cb9cc5aa6f");
  const pair = await uniFactory.getPair(upgradableProxyRamifi.address, "0x5c69bee701ef814a2b6a3edd4b1652cb9cc5aa6f");

  const torrenGeyserCallData = "0x86489ba9000000000000000000000000" + pair.substring(2) + "000000000000000000000000" + (upgradableProxyRamifi.address).substring(2) + "000000000000000000000000000000000000000000000000000000000000000A" +
    "0000000000000000000000000000000000000000000000000000000000000019" + "000000000000000000000000000000000000000000000000000000000076A700" + "00000000000000000000000000000000000000000000000000000000000F4240";
  const tokenTorrent = await deployer.deploy(TokenTorrent);
  const upgradableProxyTokenTorrent = await deployer.deploy(AdminUpgradeabilityProxy, TokenTorrent.address,
    ProxyAdmin.address, torrenGeyserCallData);

  const maestro = await deployer.deploy(Maestro, upgradableProxyRamifiPolicy.address);
  const oracleTWAP = await deployer.deploy(OracleTWAP, "0x5c69bee701ef814a2b6a3edd4b1652cb9cc5aa6f ", upgradableProxyRamifi.address, "0xd0A1E359811322d97991E03f863a0C30C2cF029C");
  const commmodityOracle = await deployer.deploy(CommmodityOracle, 86400, 0, 1);
  const apiConsumer = await deployer.deploy(APIConsumer, CommmodityOracle.address, Maestro.address);

  const bex = await deployer.deploy(Bex, deployerAddress[0]);
  const timeLock = await deployer.deploy(Timelock, deployerAddress[0], 300);
  const governorAlpha = await deployer.deploy(GovernorAlpha, Timelock.address, Bex.address, "0x0000000000000000000000000000000000000000");

  const proxyRamifi = await Ramifi.at(upgradableProxyRamifi.address);
  await proxyRamifi.approve(upgradableProxyTokenTorrent.address, "115792089237316195423570985008687907853269984665640564039457584007913129639935");
  await proxyRamifi.setMonetaryPolicy(upgradableProxyRamifiPolicy.address);
  
  const proxyRamifiPolicy = await RamifiPolicy.at(upgradableProxyRamifiPolicy.address);
  await proxyRamifiPolicy.setMarketOracle(OracleTWAP.address);
  await proxyRamifiPolicy.setCpiOracle(CommmodityOracle.address);
  await proxyRamifiPolicy.setMaestro(Maestro.address);

  const proxyTokenTorrent = await TokenTorrent.at(upgradableProxyTokenTorrent.address);
  await proxyTokenTorrent.lockTokens("10000000000000000000000", "7776000");

  const commmodityOracleCall = await CommmodityOracle.at(CommmodityOracle.address);
  await commmodityOracleCall.addProvider(APIConsumer.address);

  const timelockCall = await Timelock.at(Timelock.address);
  await timelockCall.setPendingAdmin(GovernorAlpha.address);

  const governorAlphaCall = await GovernorAlpha.at(GovernorAlpha.address);
  await governorAlphaCall.acceptAdmin(APIConsumer.address);
}

module.exports = function (deployer) {
  deployer.then(async () => {
    console.log(deployer.network);
    switch (deployer.network) {
      case 'development':
      case 'rinkeby':
      case 'ropsten':
        await deployContracts(deployer);
        break;
      case 'kovan':
        await deployContracts(deployer);
        break;
      case 'mainnet':
      case 'mainnet-fork':
        await deployContracts(deployer);
        break;
      default:
        throw ("Unsupported network");
    }
  }) 
};
