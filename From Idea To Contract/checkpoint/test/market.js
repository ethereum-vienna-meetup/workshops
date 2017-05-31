var Market = artifacts.require("./Market.sol");

contract('Market', function(accounts) {
  const creator = accounts[0]
  const taker = accounts[2]
  const price = web3.toBigNumber(web3.toWei(1))
  const product = 'Cup'

  let id = web3.toBigNumber(0)

  it('should addOffer', async function() {
    let market = await Market.deployed();
    let { logs } = await market.addOffer(product, price);
    let { event, args } = logs[0];
    assert.equal(event, 'OfferAdded');
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
      '0x0000000000000000000000000000000000000000'
    ]);
  })

  it('should not accept insufficient ether', async function() {
    let market = await Market.deployed();
    try {
      await market.takeOffer(id, { from: taker, value: price.minus(1) });
    } catch(err) {
      assert.include(err.message, 'invalid opcode');
      return;
    }
    throw new Error('expected throw');
  })

  it('should takeOffer', async function() {
    let market = await Market.deployed();
    let { logs } = await market.takeOffer(id, {
      from: taker,
      value: price
    });
    let { event, args } = logs[0]
    assert.equal(event, 'OfferTaken')
    assert.deepEqual(args, { id })

    assert.deepEqual(web3.eth.getBalance(market.address), price);
  })

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
  })
})
