var ReputationToken = artifacts.require("./ReputationToken.sol");
var Market = artifacts.require("./Market.sol");

module.exports = function(deployer) {
  deployer.deploy(ReputationToken);
  deployer.deploy(Market);
};
