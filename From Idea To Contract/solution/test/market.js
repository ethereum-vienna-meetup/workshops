var Market = artifacts.require("./Market.sol");
var ReputationToken = artifacts.require("./ReputationToken.sol");

contract('Market', function(accounts) {
  const creator = accounts[0]
  const arbiter = accounts[1]
  const taker = accounts[2]
  const price = web3.toBigNumber(web3.toWei(1))
  const product = 'Cup'

  let id = web3.toBigNumber(0)

  it('should whitelist', async function() {
    let market = await Market.deployed();
    await market.setWhitelist(creator, true);
    await market.setWhitelist(arbiter, true);
    await market.setWhitelist(taker, true);
  })

  it('should addOffer', async function() {
    let market = await Market.deployed();
    let { logs } = await market.addOffer(product, price, arbiter);
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
      '0x0000000000000000000000000000000000000000',
      arbiter
    ]);
  })

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

  async function makeAndTake() {
    let market = await Market.deployed();
    id = id.plus(1);
    await market.addOffer(product, price, arbiter);
    await market.takeOffer(id, arbiter, { from: taker, value: price });
  }

  it('should resolve (delivered)', async function() {
    await makeAndTake()
    let market = await Market.deployed();
    let expected = web3.eth.getBalance(creator).plus(price);
    await market.resolve(1, true, false, { from: arbiter });
    assert.deepEqual(web3.eth.getBalance(creator), expected);
    let rep = ReputationToken.at(await market.reputation());
    assert.deepEqual(await rep.balanceOf(creator), price.times(2));
  })

  it('should resolve (not delivered, burned)', async function() {
    await makeAndTake()
    let market = await Market.deployed();
    let expected = web3.eth.getBalance(taker).plus(price);
    await market.resolve(2, false, true, { from: arbiter });
    assert.deepEqual(web3.eth.getBalance(taker), expected);
    let rep = ReputationToken.at(await market.reputation());
    assert.deepEqual(await rep.balanceOf(creator), price);
  })

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
