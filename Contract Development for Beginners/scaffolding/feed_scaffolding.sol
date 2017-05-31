pragma solidity >= 0.4.10;
contract Feed {

    /* event to be fired when the value changes */
    event Updated(uint value);
    
    /// @dev constructor, called at deployment
    /// @param initialValue the value after deployment
    function Feed(uint initialValue) {
        /* constructor code goes here */
    }
    
    /// @dev update the stored value
    /// @param value_ the new value
    function update(uint value_) {
        /* update the state if the sender is the creator */
    }
    
}