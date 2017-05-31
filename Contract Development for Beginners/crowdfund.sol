pragma solidity >= 0.4.10;
contract token {
    mapping (address => uint) public coinBalanceOf;
    function token() {}
    function sendCoin(address receiver, uint amount) { 
        coinBalanceOf[receiver] += amount;
    }
}

contract Crowdsale {

    address public beneficiary;
    uint public fundingGoal; 
    uint public amountRaised; uint public deadline; uint public price;
    
    token public tokenReward;
    Funder[] public funders;
    mapping (address => bool) public participated;
    event FundTransfer(address backer, uint amount, bool isContribution);

    /* data structure to hold information about campaign contributors */
    struct Funder {
        address addr;
        uint amount;
    }

    /*  at initialization, setup the owner */
    function Crowdsale(address _beneficiary, uint _fundingGoal, uint _duration, uint _price) {
        beneficiary = _beneficiary;
        fundingGoal = _fundingGoal;
        // Special keyword for 1 minute in unix time
        deadline = now + _duration * 1 minutes;
        price = _price;
        // Coerce an address into a contract type
        tokenReward = new token();
    }   

    /* The function without name is the default function that is called whenever anyone sends funds to a contract */
    function () payable {
        uint amount = msg.value;
        
        // push an additional value onto the array
        funders.push(Funder({addr: msg.sender, amount: amount}));
        participated[msg.sender] = true;
        amountRaised += amount;
        // sends a sendCoin message to the tokenReward contract
        tokenReward.sendCoin(msg.sender, amount / price);
        FundTransfer(msg.sender, amount, true);
    }

    modifier afterDeadline() { if (now >= deadline) _; }

    /* checks if the goal or time limit has been reached and ends the campaign */
    function checkGoalReached() afterDeadline {
        if (amountRaised >= fundingGoal){
            // sends amountRaised wei to beneficiary account
            if (!beneficiary.send(amountRaised)) throw;
            FundTransfer(beneficiary, amountRaised, false);
        } else {
            for (uint i = 0; i < funders.length; ++i) {
              var funder = funders[i];
              funder.addr.transfer(funder.amount); /* Potential exploit */
              FundTransfer(funder.addr, funder.amount, false);
            }               
        }
        // kills contract and sends remaining ether to beneficiary
        selfdestruct(beneficiary);
    }
}