pragma solidity >= 0.4.10;
contract Subscription {    

    /* event when there is not enough wei to collect */
    event FailedToPay();
    /* event when collecting was successful */
    event Paid();
    /* event when the subscription has been cancelled */
    event Cancelled();
    
    /// @dev constructor, called at deployment
    /// @param recipient_ recipient of the payments
    /// @param price_ amount of wei that needs to be paid for each time period
    /// @param time_ duration of a time period
    function Subscription(address recipient_, uint price_, uint time_) {
        
    }
    
    /// @dev send one payment to the recipient if possible
    /* uses require_active modifier */
    function collect() returns(bool) {
        
    }
    
    /// @dev cancel the subscription, works only if there is no payment due    
    /* uses require_active modifier */
    function cancel() returns(bool) {
        
    }
    
    function() payable {
        
    }
    
}
