class App {
  statuses = {
    Harvested: 0,
    Processed: 1,
    Packed: 2,
    ForSale: 3,
    Sold: 4,
    Shipped: 5,
    Received: 6,
    Purchased: 7,
  };

  provider = null;

  instance = null;

  accounts = [];

  sku = 0;

  upc = 0;

  metamaskAccountID = "0x000000";

  ownerID = "0x000000";

  originFarmerID = "0x000000";

  originFarmName = null;

  originFarmInformation = null;

  originFarmLatitude = null;

  originFarmLongitude = null;

  productNotes = null;

  productPrice = 0;

  distributorID = "0x000000";

  retailerID = "0x000000";

  consumerID = "0x000000";

  farmerRole = null;

  distributorRole = null;

  retailerRole = null;

  consumerRole = null;

  farmerAddress = "0x000000";

  distributorAddress = "0x000000";

  retailerAddress = "0x000000";

  consumerAddress = "0x000000";

  guestAddress = "0x000000";

  alertPlaceholder = null;

  constructor(props) {
    this.init();
  }

  init = async () => {
    try {
      this.initElements();

      await this.initWeb3();
      await this.initContract();
      await this.initRoles();
      await this.initAddresses();

      this.bindEvents();
    } catch (error) {
      this.addMessage(error.message ?? "Unknown error", "danger");
      console.error(error);
    }
  };

  initWeb3 = async () => {
    if (undefined !== window.ethereum) {
      this.provider = window.ethereum;

      try {
        const accounts = await window.ethereum.request({
          method: "eth_requestAccounts",
        });

        this.metamaskAccountID = accounts[0];
        this.accounts = accounts.reverse();
      } catch (error) {
        this.addMessage(error.message ?? "Unknown error", "danger");
        console.error(error);
      }
    } else if (window.web3) {
      this.provider = window.web3.currentProvider;
    } else {
      this.provider = new Web3("http://127.0.0.1:9545");
    }
  };

  initContract = async () => {
    const data = await $.getJSON("../../build/contracts/SupplyChain.json");
    const SupplyChain = TruffleContract(data);

    SupplyChain.setProvider(this.provider);

    this.instance = await SupplyChain.deployed();
  };

  initRoles = async () => {
    this.farmerRole = await this.instance.FARMER_ROLE();
    this.distributorRole = await this.instance.DISTRIBUTOR_ROLE();
    this.retailerRole = await this.instance.RETAILER_ROLE();
    this.consumerRole = await this.instance.CONSUMER_ROLE();
  };

  initAddresses = async () => {
    this.farmerAddress = this.accounts[1];
    this.distributorAddress = this.accounts[2];
    this.retailerAddress = this.accounts[3];
    this.consumerAddress = this.accounts[4];
    this.guestAddress = this.accounts[5];
  };

  initElements = () => {
    this.alertPlaceholder = $("#alertPlaceholder");
  };

  addMessage = (message, type) => {
    const alert = `<div class="alert alert-${type} alert-dismissible fade show shadow" role="alert">
      ${message}
      <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
    </div>`;

    this.alertPlaceholder.append(alert);
  };

  clearMessages = () => {
    this.alertPlaceholder.html("");
  };

  bindEvents = () => {
    $("[data-action]").on("click", this.handleButtonClick.bind(this));
    $("#assignRoles").on("submit", this.handleAssignRole.bind(this));
  };

  handleAssignRole = async (event) => {
    event.preventDefault();

    this.clearMessages();

    const address = $(event.target).find('[name="userAddress"]').val();
    const role = $(event.target).find('[name="userRole"]').val();

    if (!role || !address) {
      this.addMessage("Role and address are required", "danger");
      return;
    }

    let roleCode = null;

    try {
      switch (role) {
        case "farmer":
          roleCode = this.farmerRole;
          break;
        case "distributor":
          roleCode = this.distributorRole;
          break;
        case "retailer":
          roleCode = this.retailerRole;
          break;
        case "consumer":
          roleCode = this.consumerRole;
          break;
        default:
          throw new Error("Invalid role");
      }

      await this.instance.grantRole(roleCode, address, {
        from: this.metamaskAccountID,
      });

      this.addMessage(`Role ${role} assigned to ${address}`, "success");
    } catch (error) {
      this.addMessage(error.message ?? "Unknown error", "danger");
      console.error(error);
    }
  };

  handleButtonClick = async (event) => {
    event.preventDefault();

    const action = $(event.target).data("action");

    if (!action) {
      return;
    }

    try {
      switch (action) {
        case "harvest":
          await this.harvestItem(event);
          break;
        case "process":
          await this.processItem(event);
          break;
        case "pack":
          await this.packItem(event);
          break;
        case "sell":
          await this.sellItem(event);
          break;
        case "buy":
          await this.buyItem(event);
          break;
        case "ship":
          await this.shipItem(event);
          break;
        case "receive":
          await this.receiveItem(event);
          break;
        case "purchase":
          await this.purchaseItem(event);
          break;
        case "fetchData1":
          await this.fetchItemBufferOne(event);
          break;
        case "fetchData2":
          await this.fetchItemBufferTwo(event);
          break;
        default:
          console.warn(`No handler for action: ${action}`);
          break;
      }
    } catch (error) {
      this.addMessage(error.message ?? "Unknown error", "danger");
      console.error(error);
    }
  };

  harvestItem = async (event) => {
    event.preventDefault();

    const form = document.getElementById("farmDetails");

    const formData = new FormData(form);

    // const upc = $("#upc").val();
    const originFarmName = formData.get("originFarmName");
    const originFarmInformation = formData.get("originFarmInformation");
    const originFarmLatitude = formData.get("originFarmLatitude");
    const originFarmLongitude = formData.get("originFarmLongitude");
    const productNotes = formData.get("productNotes");

    // this.upc = upc;
    this.originFarmName = originFarmName;
    this.originFarmInformation = originFarmInformation;
    this.originFarmLatitude = originFarmLatitude;
    this.originFarmLongitude = originFarmLongitude;
    this.productNotes = productNotes;

    const tx = await this.instance.harvestItem(
      this.upc,
      this.farmerAddress,
      originFarmName,
      originFarmInformation,
      originFarmLatitude,
      originFarmLongitude,
      productNotes
    );

    console.log(tx);

    this.addMessage(`Transaction hash: ${tx.tx}`, "success");
  };

  processItem = async (event) => {
    event.preventDefault();

    const upc = $("#upc").val();

    await this.instance.processItem(upc);

    $("#ftc-item").text(`UPC: ${upc}`);
  };

  packItem = async (event) => {
    event.preventDefault();

    const upc = $("#upc").val();

    await this.instance.packItem(upc);

    $("#ftc-item").text(`UPC: ${upc}`);
  };

  sellItem = async (event) => {
    event.preventDefault();

    const upc = $("#upc").val();
    const productPrice = Web3.utils.toWei($("#productPrice").val(), "ether");

    await this.instance.sellItem(upc, productPrice);

    $("#ftc-item").text(`UPC: ${upc}`);
  };

  buyItem = async (event) => {
    event.preventDefault();

    const upc = $("#upc").val();
    const productPrice = Web3.utils.toWei($("#productPrice").val(), "ether");

    const tx = await this.instance.buyItem(upc, {
      value: productPrice,
    });

    console.log(tx);

    // addItemToHistory(upc, tx.hash);

    $("#ftc-item").text(`UPC: ${upc}`);
  };

  shipItem = async (event) => {
    event.preventDefault();

    const upc = $("#upc").val();

    await this.instance.shipItem(upc);

    $("#ftc-item").text(`UPC: ${upc}`);
  };

  receiveItem = async (event) => {
    event.preventDefault();

    const upc = $("#upc").val();

    await this.instance.receiveItem(upc);

    $("#ftc-item").text(`UPC: ${upc}`);
  };

  purchaseItem = async (event) => {
    event.preventDefault();

    const upc = $("#upc").val();

    await this.instance.purchaseItem(upc);

    $("#ftc-item").text(`UPC: ${upc}`);
  };

  fetchItemBufferOne = async (event) => {
    event.preventDefault();

    const form = document.getElementById("productCheck");

    const formData = new FormData(form);

    const upc = formData.get("productUpc");

    const result = await this.instance.fetchItemBufferOne(upc);

    console.log(result);

    // const $el = $("#ftc-item");
    //
    // $el.text(`UPC: ${upc}`);
    // $el.append(`<li>SKU: ${result[0]}</li>`);
    // $el.append(`<li>UPC: ${result[1]}</li>`);
    // $el.append(`<li>Owner ID: ${result[2]}</li>`);
    // $el.append(`<li>Origin Farmer ID: ${result[3]}</li>`);
    // $el.append(`<li>Origin Farm Name: ${result[4]}</li>`);
    // $el.append(`<li>Origin Farm Information: ${result[5]}</li>`);
    // $el.append(`<li>Origin Farm Latitude: ${result[6]}</li>`);
    // $el.append(`<li>Origin Farm Longitude: ${result[7]}</li>`);
  };

  fetchItemBufferTwo = async (event) => {
    event.preventDefault();

    const form = document.getElementById("productCheck");

    const formData = new FormData(form);

    const upc = formData.get("productUpc");

    const result = await this.instance.fetchItemBufferTwo(upc);

    console.log(result);

    // $el.text(`UPC: ${upc}`);
    // $el.append(`<li>SKU: ${result[0]}</li>`);
    // $el.append(`<li>UPC: ${result[1]}</li>`);
    // $el.append(`<li>Product ID: ${result[2]}</li>`);
    // $el.append(`<li>Product Notes: ${result[3]}</li>`);
    // $el.append(`<li>Product Price: ${result[4]}</li>`);
    // $el.append(`<li>Item State: ${result[5]}</li>`);
    // $el.append(`<li>Distributor ID: ${result[6]}</li>`);
    // $el.append(`<li>Retailer ID: ${result[7]}</li>`);
    // $el.append(`<li>Consumer ID: ${result[8]}</li>`);
  };
}

$(window).on("load", function () {
  new App();
});
