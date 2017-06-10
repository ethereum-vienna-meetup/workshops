var Market = artifacts.require("./Market.sol");
var ReputationToken = artifacts.require("./ReputationToken.sol");

/* simulates every offer lifecycle */
contract('Market', function(accounts) {
  // a set of constants for reuse in various tests
  const creator = accounts[0]
  const arbiter = accounts[1]
  const taker = accounts[2]
  const price = web3.toBigNumber(web3.toWei(1))
  const product = 'Cup'

  let id = web3.toBigNumber(0)

  // whitelists all accounts for the remaining tests
  it('should whitelist', async function() {
    let market = await Market.deployed();
    await market.setWhitelist(creator, true);
    await market.setWhitelist(arbiter, true);
    await market.setWhitelist(taker, true);
  })

  // adds an offer
  it('should addOffer', async function() {
    // gets the Market instance deployed from Truffle
    let market = await Market.deployed();
    // creates transaction and returns object with txHash, logs, etc.
    let { logs } = await market.addOffer(product, price, arbiter);
    // event contains the name, args the arguments as a json object
    let { event, args } = logs[0];
    assert.equal(event, 'OfferAdded');
    // price needs to be BigNumber for this equal check to work
    assert.deepEqual(args, {
      id,
      product,
      price
    });
    
    let offer = await market.offers(0);
    assert.deepEqual(offer, [
      product,
      price,
      web3.toBigNumber(0),
      creator,
      '0x0000000000000000000000000000000000000000',
      arbiter
    ]);
  })

  // takes the offer
  it('should takeOffer', async function() {
    let market = await Market.deployed();
    let { logs } = await market.takeOffer(id, arbiter, {
      from: taker,
      value: price
    });
    let { event, args } = logs[0]
    assert.equal(event, 'OfferTaken')
    assert.deepEqual(args, { id })

    assert.deepEqual(web3.eth.getBalance(market.address), price);
  })

  // confirms the offer
  it('should confirm', async function() {
    let market = await Market.deployed();
    let expected = web3.eth.getBalance(creator).plus(price);
    let { logs } = await market.confirm(id, {
      from: taker
    });
    let { event, args } = logs[0]
    assert.equal(event, 'OfferConfirmed')
    assert.deepEqual(args, { id })
    assert.equal(web3.eth.getBalance(market.address),0);
    assert.deepEqual(web3.eth.getBalance(creator), expected);
    let rep = ReputationToken.at(await market.reputation());
    assert.deepEqual(await rep.balanceOf(creator), price);
  })

  // helper function to make and then take an offer
  async function makeAndTake() {
    let market = await Market.deployed();
    id = id.plus(1);
    await market.addOffer(product, price, arbiter);
    await market.takeOffer(id, arbiter, { from: taker, value: price });
  }

  // tests arbiter resolution if delivered
  it('should resolve (delivered)', async function() {
    await makeAndTake()
    let market = await Market.deployed();
    let expected = web3.eth.getBalance(creator).plus(price);
    await market.resolve(1, true, false, { from: arbiter });
    assert.deepEqual(web3.eth.getBalance(creator), expected);
    let rep = ReputationToken.at(await market.reputation());
    assert.deepEqual(await rep.balanceOf(creator), price.times(2));
  })

  // tests arbiter resolution if not delivered
  it('should resolve (not delivered, burned)', async function() {
    await makeAndTake()
    let market = await Market.deployed();
    let expected = web3.eth.getBalance(taker).plus(price);
    await market.resolve(2, false, true, { from: arbiter });
    assert.deepEqual(web3.eth.getBalance(taker), expected);
    let rep = ReputationToken.at(await market.reputation());
    assert.deepEqual(await rep.balanceOf(creator), price);
  })

  // tests arbiter resolution if not delivered but without burning
  it('should resolve (not delivered, not burned)', async function() {
    await makeAndTake()
    let market = await Market.deployed();
    let expected = web3.eth.getBalance(taker).plus(price);
    await market.resolve(3, false, false, { from: arbiter });
    assert.deepEqual(web3.eth.getBalance(taker), expected);
    let rep = ReputationToken.at(await market.reputation());
    assert.deepEqual(await rep.balanceOf(creator), price);
  })
})
