pragma solidity >= 0.4.10;
import "./Whitelisted.sol";
import "./ReputationToken.sol";

contract Market is Whitelisted {

    /* Status enum for the 3 possible states */
    enum Status { OFFERED, TAKEN, CONFIRMED, ABORTED }

    event OfferAdded(uint indexed id, string product, uint price);
    event OfferTaken(uint indexed id);
    event OfferConfirmed(uint indexed id);

    /* Struct for storing an offer */
    struct Offer {
      string product; /* product name */
      uint price; /* price in wei */
      Status status; /* current status of the offer */
      address creator; /* creator of the offer */
      address taker; /* taker of the offer, is 0 if not yet taken */
      address arbiter;
    }

    /* Array of offers with autogenerated getter */
    Offer[] public offers;

    ReputationToken public reputation = new ReputationToken();

    modifier inState(uint id, Status status) {
      require(offers[id].status == status);
      _;
    }

    /// @dev add a new offer
    /// @param product product name
    /// @param price price in wei
    /// @return id of the new offer
    function addOffer(string product, uint price, address arbiter)
    restriced returns (uint) {
      /* get next id */
      var id = offers.length;
      /* add a new offer to the array */
      offers.push(Offer({
          product: product,
          price: price,
          status: Status.OFFERED,
          creator: msg.sender, /* sender is the creator */
          taker: 0, /* set taker 0 for now */
          arbiter: arbiter
      }));
      OfferAdded(id, product, price);
      /* return the id */
      return id;
    }

    function setArbiter(uint id, address arbiter)
    inState(id, Status.OFFERED) {
      var offer = offers[id];
      require(msg.sender == offer.creator);
      require(whitelist[arbiter]);
      offer.arbiter = arbiter;
    }

    /// @dev take a offer
    /// @param id id of the offer
    function takeOffer(uint id, address arbiter)
    inState(id, Status.OFFERED) restriced payable {
      /* get the offer from the array */
      var offer = offers[id];
      /* throw if the sent value does not match the offer */
      require(msg.value == offer.price);
      require(offer.arbiter == arbiter);

      /* set status to taken */
      offer.status = Status.TAKEN;
      /* set taker */
      offer.taker = msg.sender;

      reputation.block(offer.creator, offer.price);

      OfferTaken(id);
    }

    function finalize(uint id) internal {
      var offer = offers[id];
      offer.status = Status.CONFIRMED;
      offer.creator.transfer(offer.price);
      reputation.inflate(offer.creator, offer.price);
      OfferConfirmed(id);
    }

    /// @dev confirm a shipment
    /// @param id id of the offer
    function confirm(uint id)
    inState(id, Status.TAKEN) {
      /* throw if sender is not the taker */
      require(offers[id].taker == msg.sender);
      finalize(id);
    }

    function resolve(uint id, bool delivered, bool burn)
    inState(id, Status.TAKEN) restriced {
      var offer = offers[id];
      require(offer.arbiter == msg.sender);

      if(delivered) {
        finalize(id);
      } else {
        offer.taker.transfer(offer.price);
        offer.status = Status.ABORTED;
        if(burn) reputation.burn(offer.creator, offer.price);
      }

      reputation.unblock(offer.creator, offer.price);
    }

}
