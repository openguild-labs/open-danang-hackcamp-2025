const chai = require('chai');
const { expect } = chai;
const { ZeroAddress, utils, keccak256, solidityPacked, getCreate2Address } = require('ethers');
const { expandTo18Decimals, getWallets, encodePrice, mineBlock } = require('./shared/utilities');


const TOTAL_SUPPLY = expandTo18Decimals(10000)
const TEST_AMOUNT = expandTo18Decimals(10)
const MINIMUM_LIQUIDITY = BigInt('1000')



describe('UniswapV2Pair', function() {
  let factory;
  let token0;
  let token1;
  let pair;

  let wallet;
  let other;

  const network = require('hardhat').network;
  beforeEach(async function() {

    [wallet, other] = await ethers.getSigners();

    let UniswapV2Pair;
    if (hre.network.name == 'polkavm' || hre.network.name == 'ah') {
      UniswapV2Pair = await ethers.getContractFactory("UniswapV2Pair", getWallets(1)[0]);
    } else {
      UniswapV2Pair = await ethers.getContractFactory("UniswapV2Pair");
    }

    const ERC20 = await ethers.getContractFactory("ERC20");
    token0 = await ERC20.deploy(TOTAL_SUPPLY);
    await token0.waitForDeployment();

    token1 = await ERC20.deploy(TOTAL_SUPPLY);
    await token1.waitForDeployment();

    let pairForCode = await UniswapV2Pair.deploy();
    await pairForCode.waitForDeployment();

    const UniswapV2Factory = await ethers.getContractFactory("UniswapV2Factory", wallet);
    factory = await UniswapV2Factory.deploy(wallet.address);
    await factory.waitForDeployment();
    
    let token0Address = await token0.getAddress();
    let token1Address = await token1.getAddress();

    // Ensure token0/token1 variables **and** their address counterparts are consistently ordered
    // Compare numerically to avoid checksum‑case discrepancies
    if (BigInt(token0Address) > BigInt(token1Address)) {
      [token0, token1] = [token1, token0];
      [token0Address, token1Address] = [token1Address, token0Address];
    }

    const first = token0Address;
    const second = token1Address;

    const bytecode = UniswapV2Pair.bytecode;
    const initCodeHash = keccak256(bytecode);
    let salt = keccak256(solidityPacked(['address', 'address'], [first, second]));
    const create2Address = getCreate2Address(await factory.getAddress(), salt, initCodeHash);

    await expect(factory.createPair(token0Address, token1Address)).to.emit(factory, "PairCreated")
    .withArgs(await first, second, create2Address, 1n);

    pair = await ethers.getContractAt("UniswapV2Pair", create2Address); 
    expect(await pair.token0()).to.eq(first);
    expect(await pair.token1()).to.eq(second);

  });

  it('mint', async function() {
    const token0Amount = expandTo18Decimals(1);
    const pairAddress = await pair.getAddress();
    const token1Amount = expandTo18Decimals(4);
    await token0.transfer(pairAddress, token0Amount);
    await token1.transfer(pairAddress, token1Amount);

    const expectedLiquidity = expandTo18Decimals(2);

    await expect(pair.mint(wallet.address))
      .to.emit(pair, 'Transfer')
      .withArgs(ZeroAddress, ZeroAddress, MINIMUM_LIQUIDITY)
      .to.emit(pair, 'Transfer')
      .withArgs(ZeroAddress, wallet.address, expectedLiquidity - MINIMUM_LIQUIDITY)
      .to.emit(pair, 'Sync')
      .withArgs(token0Amount, token1Amount)
      .to.emit(pair, 'Mint')
      .withArgs(wallet.address, token0Amount, token1Amount);

    expect(await pair.totalSupply()).to.eq(expectedLiquidity);
    expect(await pair.balanceOf(wallet.address)).to.eq(expectedLiquidity - MINIMUM_LIQUIDITY);
    expect(await token0.balanceOf(await pair.getAddress())).to.eq(token0Amount);
    expect(await token1.balanceOf(await pair.getAddress())).to.eq(token1Amount);
    const reserves = await pair.getReserves();
    expect(reserves[0]).to.eq(token0Amount);
    expect(reserves[1]).to.eq(token1Amount);
  });

  async function addLiquidity(token0Amount, token1Amount) {
    await token0.transfer(await pair.getAddress(), token0Amount);
    await token1.transfer(await pair.getAddress(), token1Amount);
    await pair.mint(wallet.address);
  }

  const swapTestCases = [
    [1, 5, 10, '1662497915624478906'],
    [1, 10, 5, '453305446940074565'],
    [2, 5, 10, '2851015155847869602'],
    [2, 10, 5, '831248957812239453'],
    [1, 10, 10, '906610893880149131'],
    [1, 100, 100, '987158034397061298'],
    [1, 1000, 1000, '996006981039903216']
  ].map(a => a.map(n => typeof n === 'string' ? BigInt(n) : expandTo18Decimals(n)));

  swapTestCases.forEach((swapTestCase, i) => {
    it(`getInputPrice:${i}`, async function() {
      this.timeout(60000)
      const [swapAmount, token0Amount, token1Amount, expectedOutputAmount] = swapTestCase;
      await addLiquidity(token0Amount, token1Amount);
      await token0.transfer(await pair.getAddress(), swapAmount);
      await expect(pair.swap(0, expectedOutputAmount + 1n, wallet.address, '0x'))
        .to.be.revertedWith('UniswapV2: K');
      await pair.swap(0, expectedOutputAmount, wallet.address, '0x');
    });
  });

  const optimisticTestCases = [
    ['997000000000000000', 5, 10, 1],
    ['997000000000000000', 10, 5, 1],
    ['997000000000000000', 5, 5, 1],
    [1, 5, 5, '1003009027081243732']
  ].map(a => a.map(n => typeof n === 'string' ? BigInt(n) : expandTo18Decimals(n)));

  optimisticTestCases.forEach((optimisticTestCase, i) => {
    it(`optimistic:${i}`, async function() {
      this.timeout(60000)
      const [outputAmount, token0Amount, token1Amount, inputAmount] = optimisticTestCase;
      await addLiquidity(token0Amount, token1Amount);
      await token0.transfer(await pair.getAddress(), inputAmount);
      await expect(pair.swap(outputAmount + 1n, 0, wallet.address, '0x'))
        .to.be.revertedWith('UniswapV2: K');
      await pair.swap(outputAmount, 0, wallet.address, '0x');
    });
  });

  it('swap:token0', async function() {
    this.timeout(50000)
    const token0Amount = expandTo18Decimals(5);
    const token1Amount = expandTo18Decimals(10);
    await addLiquidity(token0Amount, token1Amount);

    const swapAmount = expandTo18Decimals(1);
    const expectedOutputAmount = BigInt('1662497915624478906');
    await token0.transfer(await pair.getAddress(), swapAmount);

    await expect(pair.swap(0, expectedOutputAmount, wallet.address, '0x'))
      .to.emit(token1, 'Transfer')
      .withArgs(await pair.getAddress(), wallet.address, expectedOutputAmount)
      .to.emit(pair, 'Sync')
      .withArgs(token0Amount + swapAmount, token1Amount - expectedOutputAmount)
      .to.emit(pair, 'Swap')
      .withArgs(wallet.address, swapAmount, 0, 0, expectedOutputAmount, wallet.address);
    const reserves = await pair.getReserves();
    expect(reserves[0]).to.eq(token0Amount + swapAmount);
    expect(reserves[1]).to.eq(token1Amount - expectedOutputAmount);
    expect(await token0.balanceOf(await pair.getAddress())).to.eq(token0Amount + swapAmount);
    expect(await token1.balanceOf(await pair.getAddress())).to.eq(token1Amount - expectedOutputAmount);
    const totalSupplyToken0 = await token0.totalSupply();
    const totalSupplyToken1 = await token1.totalSupply();
    expect(await token0.balanceOf(wallet.address)).to.eq(totalSupplyToken0 - token0Amount - swapAmount);
    expect(await token1.balanceOf(wallet.address)).to.eq(totalSupplyToken1 - token1Amount + expectedOutputAmount);
  });

  it('swap:token1', async function() {
    this.timeout(50000)
    const token0Amount = expandTo18Decimals(5);
    const token1Amount = expandTo18Decimals(10);
    await addLiquidity(token0Amount, token1Amount);

    const swapAmount = expandTo18Decimals(1);
    const expectedOutputAmount = BigInt('453305446940074565');
    await token1.transfer(await pair.getAddress(), swapAmount);
    await expect(pair.swap(expectedOutputAmount, 0, wallet.address, '0x'))
      .to.emit(token0, 'Transfer')
      .withArgs(await pair.getAddress(), wallet.address, expectedOutputAmount)
      .to.emit(pair, 'Sync')
      .withArgs(token0Amount - expectedOutputAmount, token1Amount + swapAmount)
      .to.emit(pair, 'Swap')
      .withArgs(wallet.address, 0, swapAmount, expectedOutputAmount, 0, wallet.address);

    const reserves = await pair.getReserves();
    expect(reserves[0]).to.eq(token0Amount - expectedOutputAmount);
    expect(reserves[1]).to.eq(token1Amount + swapAmount);
    expect(await token0.balanceOf(await pair.getAddress())).to.eq(token0Amount - expectedOutputAmount);
    expect(await token1.balanceOf(await pair.getAddress())).to.eq(token1Amount + swapAmount);
    const totalSupplyToken0 = await token0.totalSupply();
    const totalSupplyToken1 = await token1.totalSupply();
    expect(await token0.balanceOf(wallet.address)).to.eq(totalSupplyToken0 - token0Amount + expectedOutputAmount);
    expect(await token1.balanceOf(wallet.address)).to.eq(totalSupplyToken1 - token1Amount - swapAmount);
  });

  it('burn', async function() {
    const token0Amount = expandTo18Decimals(3);
    const token1Amount = expandTo18Decimals(3);
    await addLiquidity(token0Amount, token1Amount);

    const expectedLiquidity = expandTo18Decimals(3);
    await pair.transfer(await pair.getAddress(), expectedLiquidity - MINIMUM_LIQUIDITY);
    await expect(pair.burn(wallet.address))
      .to.emit(pair, 'Transfer')
      .withArgs(await pair.getAddress(), ZeroAddress, expectedLiquidity - MINIMUM_LIQUIDITY)
      .to.emit(token0, 'Transfer')
      .withArgs(await pair.getAddress(), wallet.address, token0Amount - BigInt(1000))
      .to.emit(token1, 'Transfer')
      .withArgs(await pair.getAddress(), wallet.address, token1Amount - BigInt(1000))
      .to.emit(pair, 'Sync')
      .withArgs(1000, 1000)
      .to.emit(pair, 'Burn')
      .withArgs(wallet.address, token0Amount - BigInt(1000), token1Amount - BigInt(1000), wallet.address);

    expect(await pair.balanceOf(wallet.address)).to.eq(0);
    expect(await pair.totalSupply()).to.eq(MINIMUM_LIQUIDITY);
    expect(await token0.balanceOf(await pair.getAddress())).to.eq(1000);
    expect(await token1.balanceOf(await pair.getAddress())).to.eq(1000);
    const totalSupplyToken0 = await token0.totalSupply();
    const totalSupplyToken1 = await token1.totalSupply();
    expect(await token0.balanceOf(wallet.address)).to.eq(totalSupplyToken0 - BigInt(1000));
    expect(await token1.balanceOf(wallet.address)).to.eq(totalSupplyToken1 - BigInt(1000));
  });

  // it('price{0,1}CumulativeLast', async function() {
  //   const token0Amount = expandTo18Decimals(3);
  //   const token1Amount = expandTo18Decimals(3);
  //   await addLiquidity(token0Amount, token1Amount);

  //   const reserves = await pair.getReserves();
  //   const blockTimestamp = reserves[2];
  //   console.log("blockTimestamp", blockTimestamp);
  //   const network = require('hardhat').network;
  //   await mineBlock(network.provider, blockTimestamp + BigInt(1));
  //   console.log("mined block");
  //   await pair.sync();

  //   const initialPrice = encodePrice(token0Amount, token1Amount);
  //   console.log("initialPrice", initialPrice);
  //   expect(await pair.price0CumulativeLast()).to.eq(initialPrice[0]);
  //   expect(await pair.price1CumulativeLast()).to.eq(initialPrice[1]);
  //   const updatedReserves = await pair.getReserves();
  //   expect(updatedReserves[2]).to.eq(blockTimestamp + BigInt(1));

    // const swapAmount = expandTo18Decimals(3);
    // await token0.transfer(await pair.getAddress(), swapAmount);
    // await mineBlock(provider, blockTimestamp + 10);
    // await pair.swap(0, expandTo18Decimals(1), wallet.address, '0x');

    // expect(await pair.price0CumulativeLast()).to.eq(initialPrice[0] * BigInt(10));
    // expect(await pair.price1CumulativeLast()).to.eq(initialPrice[1] * BigInt(10));
    // const latestReserves = await pair.getReserves();
    // expect(latestReserves[2]).to.eq(blockTimestamp + 10);

    // await mineBlock(provider, blockTimestamp + 20);
    // await pair.sync();

    // const newPrice = encodePrice(expandTo18Decimals(6), expandTo18Decimals(2));
    // expect(await pair.price0CumulativeLast()).to.eq(initialPrice[0]* bigInt(10) + newPrice[0] * BigInt(10));
    // expect(await pair.price1CumulativeLast()).to.eq(initialPrice[1] * BigInt(10) + (newPrice[1] * BigInt(10)));
    // const finalReserves = await pair.getReserves();
    // expect(finalReserves[2]).to.eq(blockTimestamp + 20);
  // });

  it('feeTo:off', async function() {
    this.timeout(70000)
    const token0Amount = expandTo18Decimals(1000);
    const token1Amount = expandTo18Decimals(1000);
    await addLiquidity(token0Amount, token1Amount);

    const swapAmount = expandTo18Decimals(1);
    const expectedOutputAmount = BigInt('996006981039903216');
    await token1.transfer(await pair.getAddress(), swapAmount);
    await pair.swap(expectedOutputAmount, 0, wallet.address, '0x');

    const expectedLiquidity = expandTo18Decimals(1000);
    await pair.transfer(await pair.getAddress(), expectedLiquidity - MINIMUM_LIQUIDITY);
    await pair.burn(wallet.address);
    expect(await pair.totalSupply()).to.eq(MINIMUM_LIQUIDITY);
  });

  it('feeTo:on', async function() {
    this.timeout(140000)

    await factory.setFeeTo(other.address);

    const token0Amount = expandTo18Decimals(1000);
    const token1Amount = expandTo18Decimals(1000);
    await addLiquidity(token0Amount, token1Amount);

    const swapAmount = expandTo18Decimals(1);
    const expectedOutputAmount = BigInt('996006981039903216');
    await token1.transfer(await pair.getAddress(), swapAmount);
    await pair.swap(expectedOutputAmount, 0, wallet.address, '0x');

    const expectedLiquidity = expandTo18Decimals(1000);
    await pair.transfer(await pair.getAddress(), expectedLiquidity - MINIMUM_LIQUIDITY);
    await pair.burn(wallet.address);

    expect(await pair.totalSupply()).to.eq(MINIMUM_LIQUIDITY + BigInt('249750499251388'));
    expect(await pair.balanceOf(other.address)).to.eq(BigInt('249750499251388'));

    expect(await token0.balanceOf(await pair.getAddress())).to.eq(BigInt(1000) + BigInt('249501683697445'));
    expect(await token1.balanceOf(await pair.getAddress())).to.eq(BigInt(1000) + BigInt('250000187312969'));
  });
});