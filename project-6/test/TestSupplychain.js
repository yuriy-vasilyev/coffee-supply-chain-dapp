// This script is designed to test the solidity smart contract - SuppyChain.sol -- and the various functions within

// Declare a variable and assign the compiled smart contract artifact
const SupplyChain = artifacts.require("SupplyChain");

const BN = web3.utils.BN;

const ROLES = {
  FARMER: web3.utils.keccak256("FARMER_ROLE"),
  DISTRIBUTOR: web3.utils.keccak256("DISTRIBUTOR_ROLE"),
  RETAILER: web3.utils.keccak256("RETAILER_ROLE"),
  CONSUMER: web3.utils.keccak256("CONSUMER_ROLE"),
};

const PRODUCT_INFO = {
  sku: 1,
  upc: 1,
  productID: 2,
  farmName: "John Doe",
  farmInformation: "Yarra Valley",
  latitude: "-38.23977",
  longitude: "144.34149",
  productNotes: "Best beans for Espresso",
  productPrice: web3.utils.toWei(BN(1), "ether"),
};

const STATUS = {
  Harvested: 0,
  Processed: 1,
  Packed: 2,
  ForSale: 3,
  Sold: 4,
  Shipped: 5,
  Received: 6,
  Purchased: 7,
};

contract("SupplyChain", async function (accounts) {
  const ADDRESSES = {
    owner: accounts[0],
    farmer: accounts[1],
    distributor: accounts[2],
    retailer: accounts[3],
    consumer: accounts[4],
    guest: accounts[5],
  };

  let instance;

  const runItemTests = async (instance, context) => {
    // Retrieve the just now saved item from blockchain by calling function fetchItem()
    const resultBufferOne = await instance.fetchItemBufferOne.call(
      PRODUCT_INFO.upc
    );
    const resultBufferTwo = await instance.fetchItemBufferTwo.call(
      PRODUCT_INFO.upc
    );

    // Verify the result set
    assert.equal(
      resultBufferOne[0],
      PRODUCT_INFO.sku,
      "Error: Invalid item SKU"
    );

    assert.equal(
      resultBufferOne[1],
      PRODUCT_INFO.upc,
      "Error: Invalid item UPC"
    );

    assert.equal(
      resultBufferOne[2],
      context.ownerID,
      "Error: Missing or Invalid owner address"
    );

    assert.equal(
      resultBufferOne[3],
      ADDRESSES.farmer,
      "Error: Missing or Invalid farmer address"
    );

    assert.equal(
      resultBufferOne[4],
      PRODUCT_INFO.farmName,
      "Error: Missing or Invalid farm name"
    );

    assert.equal(
      resultBufferOne[5],
      PRODUCT_INFO.farmInformation,
      "Error: Missing or Invalid farm information"
    );

    assert.equal(
      resultBufferOne[6],
      PRODUCT_INFO.latitude,
      "Error: Missing or Invalid farm latitude"
    );

    assert.equal(
      resultBufferOne[7],
      PRODUCT_INFO.longitude,
      "Error: Missing or Invalid farm longitude"
    );

    assert.equal(
      resultBufferTwo[2],
      PRODUCT_INFO.productID,
      "Error: Invalid productID"
    );

    if (context.distributorID) {
      assert.equal(
        resultBufferTwo[6],
        context.distributorID,
        "Error: Missing or Invalid distributorID"
      );
    }

    if (context.retailerID) {
      assert.equal(
        resultBufferTwo[7],
        context.retailerID,
        "Error: Missing or Invalid retailerID"
      );
    }

    if (context.consumerID) {
      assert.equal(
        resultBufferTwo[8],
        context.consumerID,
        "Error: Missing or Invalid consumerID"
      );
    }

    assert.equal(
      resultBufferTwo[5],
      context.status,
      "Error: Invalid item Status"
    );

    assert.equal(
      context.actionResult.logs[0].event === context.eventName,
      true,
      "Invalid event emitted"
    );

    // Verify the result set
  };

  before(async () => {
    instance = await SupplyChain.deployed();

    await instance.grantRole(ROLES.FARMER, ADDRESSES.farmer, {
      from: ADDRESSES.owner,
    });
    await instance.grantRole(ROLES.DISTRIBUTOR, ADDRESSES.distributor, {
      from: ADDRESSES.owner,
    });
    await instance.grantRole(ROLES.RETAILER, ADDRESSES.retailer, {
      from: ADDRESSES.owner,
    });
    await instance.grantRole(ROLES.CONSUMER, ADDRESSES.consumer, {
      from: ADDRESSES.owner,
    });
  });

  // 1st Test
  it("Testing smart contract function harvestItem() that allows a farmer to harvest coffee", async () => {
    // Mark an item as Harvested by calling function harvestItem()
    const result = await instance.harvestItem(
      PRODUCT_INFO.upc,
      PRODUCT_INFO.farmName,
      PRODUCT_INFO.farmInformation,
      PRODUCT_INFO.latitude,
      PRODUCT_INFO.longitude,
      PRODUCT_INFO.productNotes,
      {
        from: ADDRESSES.farmer,
      }
    );

    await runItemTests(instance, {
      actionResult: result,
      ownerID: ADDRESSES.farmer,
      status: STATUS.Harvested,
      eventName: "Harvested",
    });
  });

  // 2nd Test
  it("Testing smart contract function processItem() that allows a farmer to process coffee", async () => {
    // Mark an item as Processed by calling function processItem()
    const result = await instance.processItem(PRODUCT_INFO.upc, {
      from: ADDRESSES.farmer,
    });

    await runItemTests(instance, {
      actionResult: result,
      ownerID: ADDRESSES.farmer,
      status: STATUS.Processed,
      eventName: "Processed",
    });
  });

  // 3rd Test
  it("Testing smart contract function packItem() that allows a farmer to pack coffee", async () => {
    const instance = await SupplyChain.deployed();

    const result = await instance.packItem(PRODUCT_INFO.upc, {
      from: ADDRESSES.farmer,
    });

    await runItemTests(instance, {
      actionResult: result,
      ownerID: ADDRESSES.farmer,
      status: STATUS.Packed,
      eventName: "Packed",
    });
  });

  // 4th Test
  it("Testing smart contract function setForSaleItem() that allows a farmer to sell coffee", async () => {
    const result = await instance.setForSaleItem(
      PRODUCT_INFO.upc,
      PRODUCT_INFO.productPrice,
      {
        from: ADDRESSES.farmer,
      }
    );

    await runItemTests(instance, {
      actionResult: result,
      ownerID: ADDRESSES.farmer,
      status: STATUS.ForSale,
      eventName: "ForSale",
    });
  });

  // 5th Test
  it("Testing smart contract function buyItem() that allows a distributor to buy coffee", async () => {
    const result = await instance.buyItem(PRODUCT_INFO.upc, {
      from: ADDRESSES.distributor,
      value: PRODUCT_INFO.productPrice,
    });

    await runItemTests(instance, {
      distributorID: ADDRESSES.distributor,
      actionResult: result,
      ownerID: ADDRESSES.distributor,
      status: STATUS.Sold,
      eventName: "Sold",
    });
  });

  // 6th Test
  it("Testing smart contract function shipItem() that allows a distributor to ship coffee", async () => {
    const result = await instance.shipItem(PRODUCT_INFO.upc, {
      from: ADDRESSES.distributor,
    });

    await runItemTests(instance, {
      distributorID: ADDRESSES.distributor,
      actionResult: result,
      ownerID: ADDRESSES.distributor,
      status: STATUS.Shipped,
      eventName: "Shipped",
    });
  });

  // 7th Test
  it("Testing smart contract function receiveItem() that allows a retailer to mark coffee received", async () => {
    const result = await instance.receiveItem(PRODUCT_INFO.upc, {
      from: ADDRESSES.retailer,
    });

    await runItemTests(instance, {
      retailerID: ADDRESSES.retailer,
      ownerID: ADDRESSES.retailer,
      actionResult: result,
      status: STATUS.Received,
      eventName: "Received",
    });
  });

  // 8th Test
  it("Testing smart contract function purchaseItem() that allows a consumer to purchase coffee", async () => {
    const result = await instance.purchaseItem(PRODUCT_INFO.upc, {
      from: ADDRESSES.consumer,
      value: PRODUCT_INFO.productPrice,
    });

    await runItemTests(instance, {
      consumerID: ADDRESSES.consumer,
      actionResult: result,
      ownerID: ADDRESSES.consumer,
      status: STATUS.Purchased,
      eventName: "Purchased",
    });
  });

  // 9th Test
  it("Testing smart contract function fetchItemBufferOne() that allows anyone to fetch item details from blockchain", async () => {
    // Retrieve the just now saved item from blockchain by calling function fetchItem()
    const resultBufferOne = await instance.fetchItemBufferOne.call(
      PRODUCT_INFO.upc,
      {
        from: ADDRESSES.guest,
      }
    );

    assert.equal(
      resultBufferOne[0],
      PRODUCT_INFO.sku,
      "Error: Invalid item SKU"
    );

    assert.equal(
      resultBufferOne[1],
      PRODUCT_INFO.upc,
      "Error: Invalid item UPC"
    );

    assert.equal(
      resultBufferOne[2],
      ADDRESSES.consumer,
      "Error: Missing or Invalid ownerID"
    );

    assert.equal(
      resultBufferOne[3],
      ADDRESSES.farmer,
      "Error: Missing or Invalid ADDRESSES.farmer"
    );

    assert.equal(
      resultBufferOne[4],
      PRODUCT_INFO.farmName,
      "Error: Missing or Invalid farm name"
    );

    assert.equal(
      resultBufferOne[5],
      PRODUCT_INFO.farmInformation,
      "Error: Missing or Invalid farm information"
    );

    assert.equal(
      resultBufferOne[6],
      PRODUCT_INFO.latitude,
      "Error: Missing or Invalid farm latitude"
    );

    assert.equal(
      resultBufferOne[7],
      PRODUCT_INFO.longitude,
      "Error: Missing or Invalid farm longitude"
    );
  });

  // 10th Test
  it("Testing smart contract function fetchItemBufferTwo() that allows anyone to fetch item details from blockchain", async () => {
    // Retrieve the just now saved item from blockchain by calling function fetchItem()
    const resultBufferTwo = await instance.fetchItemBufferTwo.call(
      PRODUCT_INFO.upc,
      {
        from: ADDRESSES.guest,
      }
    );

    assert.equal(
      resultBufferTwo[2],
      PRODUCT_INFO.productID,
      "Error: Invalid productID"
    );

    assert.equal(
      resultBufferTwo[6],
      ADDRESSES.distributor,
      "Error: Missing or Invalid distributorID"
    );

    assert.equal(
      resultBufferTwo[7],
      ADDRESSES.retailer,
      "Error: Missing or Invalid retailerID"
    );

    assert.equal(
      resultBufferTwo[8],
      ADDRESSES.consumer,
      "Error: Missing or Invalid consumerID"
    );

    assert.equal(
      resultBufferTwo[5],
      STATUS.Purchased,
      "Error: Invalid item Status"
    );
  });
});
