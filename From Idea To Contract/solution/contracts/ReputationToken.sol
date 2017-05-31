pragma solidity >= 0.4.10;
import "zeppelin/token/StandardToken.sol";
import "zeppelin/token/LimitedTransferToken.sol";
import "zeppelin/ownership/Ownable.sol";

contract ReputationToken is Ownable, StandardToken, LimitedTransferToken {

  mapping (address => uint) blocked;

  function block(address holder, uint value) onlyOwner {
    totalSupply = totalSupply.add(value);
    blocked[holder] = blocked[holder].add(value);
  }

  function unblock(address holder, uint value) onlyOwner {
    totalSupply = totalSupply.sub(value);
    blocked[holder] = blocked[holder].sub(value);
  }

  function inflate(address recipient, uint value) onlyOwner {
    balances[recipient] = balances[recipient].add(value);
    Transfer(0, recipient, value);
  }

  function burn(address holder, uint value) onlyOwner {
    balances[holder] = balances[holder].sub(value);
    Transfer(holder, 0, value);
  }

  function transferableTokens(address holder, uint64)
  constant public returns (uint256) {
    return balances[holder].sub(blocked[holder]);
  }

}
