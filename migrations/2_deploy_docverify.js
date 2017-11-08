// Deploy A, then deploy B, passing in A's newly deployed address
// deployer.deploy(A).then(function() {
//   return deployer.deploy(B, A.address);
// });

var DocVerify = artifacts.require("./DocVerify.sol");

module.exports = function(deployer) {
  deployer.deploy(DocVerify);
};
