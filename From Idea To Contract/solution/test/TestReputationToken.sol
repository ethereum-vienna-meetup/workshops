pragma solidity >= 0.4.11;

import "truffle/Assert.sol";
import "truffle/DeployedAddresses.sol";
import "../contracts/ReputationToken.sol";
import "./ThrowProxy.sol";

contract TestReputationToken {

  function testInflate() {
    var token = new ReputationToken();
    address destination = msg.sender;
    Assert.equal(token.balanceOf(destination), 0,
      "expected initial balance to be 0");
    token.inflate(destination, 10);
    Assert.equal(token.balanceOf(destination), 10,
      "expected balance to be 10");
    token.inflate(destination, 100);
    Assert.equal(token.balanceOf(destination), 110,
      "expected initial balance to be 110");
  }

  function testInflateNotOwner() {
    var proxy = new ThrowProxy(DeployedAddresses.ReputationToken());
    ReputationToken(proxy).inflate(msg.sender, 100);
    Assert.isFalse(proxy.execute.gas(200000)(), 'should throw');
  }
}
