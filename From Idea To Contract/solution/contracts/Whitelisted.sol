pragma solidity >= 0.4.10;
import "zeppelin/ownership/Ownable.sol";

contract Whitelisted is Ownable {
  mapping (address => bool) whitelist;

  modifier restriced() {
    require(whitelist[msg.sender]);
    _;
  }

  function setWhitelist(address addr, bool value) onlyOwner {
    whitelist[addr] = value;
  }
}
