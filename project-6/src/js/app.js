import Web3 from "https://cdn.jsdelivr.net/npm/web3@4.3.0/+esm";

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
  metamaskAccountID = "0x000000";
  farmerRole = null;
  distributorRole = null;
  retailerRole = null;
  consumerRole = null;
  $alertPlaceholder = null;

  constructor() {
    this.init().catch(console.error);
  }

  init = async () => {
    try {
      this.initElements();

      await this.initNetwork();
      await this.initContract();
      await this.initRoles();
      await this.renderTransactionHistory();

      this.bindEvents();

      if (this.isDebug()) {
        await this.outputRoles();
      }
    } catch (error) {
      this.addMessage(error.message ?? "Unknown error", "danger");
      console.error(error);
    }
  };

  initNetwork = async () => {
    if (undefined === window.ethereum) {
      this.addMessage("No Metamask installed", "danger");
      console.error("No Metamask installed");

      return;
    }

    try {
      this.provider = window.ethereum;

      const accounts = await window.ethereum.request({
        method: "eth_requestAccounts",
      });

      this.metamaskAccountID = accounts[0];
      this.accounts = accounts.reverse();
    } catch (error) {
      this.addMessage(error.message ?? "Unknown error", "danger");
      console.error(error);
    }
  };

  initContract = async () => {
    const contractArtifact = await $.getJSON(
      "../../build/contracts/SupplyChain.json"
    );
    const SupplyChain = TruffleContract(contractArtifact);

    SupplyChain.setProvider(this.provider);

    this.instance = await SupplyChain.deployed();
  };

  initRoles = async () => {
    this.farmerRole = await this.instance.FARMER_ROLE();
    this.distributorRole = await this.instance.DISTRIBUTOR_ROLE();
    this.retailerRole = await this.instance.RETAILER_ROLE();
    this.consumerRole = await this.instance.CONSUMER_ROLE();
  };

  renderTransactionHistory = async () => {
    const events = await this.getTransactionHistory();

    let output = '<div class="mt-4">';

    events.forEach((event) => {
      output += '<div class="card mb-3">';
      output += '<div class="card-header">';
      output += `<h5 class="card-title">${event.name}</h5>`;
      output += "</div>";
      output += '<ul class="list-group list-group-flush">';
      output += `<li class="list-group-item">Transaction hash: <code>${event.transactionHash}</code></li>`;
      output += `<li class="list-group-item">Block number: <code>${event.blockNumber}</code></li>`;
      output += `<li class="list-group-item">Return values: <code>${JSON.stringify(
        event.returnValues
      )}</code></li>`;
      output += "</li>";
      output += "</div>";
    });

    output += "</div>";

    this.$transactionHistoryContainer.html(output);
  };

  initElements = () => {
    this.$alertPlaceholder = $("#alertPlaceholder");
    this.$transactionHistoryContainer = $("#transactionHistory");
  };

  isDebug = () => {
    return window.location.search.includes("debug");
  };

  outputRoles = async () => {
    console.log("metamaskAccountID: ", this.metamaskAccountID);
    console.log(
      "is farmer: ",
      await this.instance.hasRole(this.farmerRole, this.metamaskAccountID)
    );
    console.log(
      "is distributor: ",
      await this.instance.hasRole(this.distributorRole, this.metamaskAccountID)
    );
    console.log(
      "is retailer: ",
      await this.instance.hasRole(this.retailerRole, this.metamaskAccountID)
    );
    console.log(
      "is consumer: ",
      await this.instance.hasRole(this.consumerRole, this.metamaskAccountID)
    );
  };

  addMessage = (message, type) => {
    const alert = `<div class="alert alert-${type} alert-dismissible fade show shadow" role="alert">
      ${message}
      <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
    </div>`;

    this.$alertPlaceholder.append(alert);
  };

  clearMessages = () => {
    this.$alertPlaceholder.html("");
  };

  bindEvents = () => {
    $("#fetchData1Form").on("submit", this.handleFetchItemBufferOne.bind(this));
    $("#fetchData2Form").on("submit", this.handleFetchItemBufferTwo.bind(this));

    $("#harvestForm").on("submit", this.handleHarvest.bind(this));
    $("#processForm").on("submit", this.handleProcess.bind(this));
    $("#packForm").on("submit", this.handlePack.bind(this));
    $("#sellForm").on("submit", this.handleSetForSale.bind(this));
    $("#buyForm").on("submit", this.handleBuy.bind(this));
    $("#shipForm").on("submit", this.handleShip.bind(this));
    $("#receiveForm").on("submit", this.handleReceive.bind(this));
    $("#purchaseForm").on("submit", this.handlePurchase.bind(this));

    $("#assignRoles").on("submit", this.handleAssignRole.bind(this));
  };

  handleFetchItemBufferOne = async (event) => {
    event.preventDefault();

    try {
      this.clearMessages();

      const $resultEl = $("#fetchData1Result");

      $resultEl.html('<div class="spinner-border"></div>');

      const formData = new FormData(event.target);

      const upc = formData.get("upc");

      if (!upc) {
        this.addMessage("UPC is required", "danger");
        return;
      }

      const result = await this.instance.fetchItemBufferOne(upc);

      if (this.isDebug()) {
        console.log(result);
      }

      let output = '<div class="mt-4">';
      output += '<ul class="list-group">';
      output += `<li class="list-group-item">SKU: <b>${result[0]}</b></li>`;
      output += `<li class="list-group-item">UPC: <b>${result[1]}</b></li>`;
      output += `<li class="list-group-item">Owner address: <b>${result[2]}</b></li>`;
      output += `<li class="list-group-item">Farmer address: <b>${result[3]}</b></li>`;
      output += `<li class="list-group-item">Farm name: <b>${result[4]}</b></li>`;
      output += `<li class="list-group-item">Farm information: <b>${result[5]}</b></li>`;
      output += `<li class="list-group-item">Farm latitude: <b>${result[6]}</b></li>`;
      output += `<li class="list-group-item">Farm longitude: <b>${result[7]}</b></li>`;
      output += "</ul>";

      $resultEl.html(output);
    } catch (error) {
      this.addMessage(error.message ?? "Unknown error", "danger");
      console.error(error);
    }
  };

  handleFetchItemBufferTwo = async (event) => {
    event.preventDefault();

    try {
      this.clearMessages();

      const $resultEl = $("#fetchData2Result");

      $resultEl.html('<div class="spinner-border"></div>');

      const formData = new FormData(event.target);

      const upc = formData.get("upc");

      if (!upc) {
        this.addMessage("UPC is required", "danger");
        return;
      }

      const result = await this.instance.fetchItemBufferTwo(upc);

      if (this.isDebug()) {
        console.log(result);
      }

      let output = '<div class="mt-4">';
      output += '<ul class="list-group">';
      output += `<li class="list-group-item">SKU: <b>${result[0]}</b></li>`;
      output += `<li class="list-group-item">UPC: <b>${result[1]}</b></li>`;
      output += `<li class="list-group-item">Product ID: <b>${result[2]}</b></li>`;
      output += `<li class="list-group-item">Product notes: <b>${result[3]}</b></li>`;
      output += `<li class="list-group-item">Product price: <b>${result[4]}</b></li>`;
      output += `<li class="list-group-item">Status: <b>${this.figureStatusLabel(
        result[5].toNumber()
      )}</b></li>`;
      output += `<li class="list-group-item">Distributor address: <b>${result[6]}</b></li>`;
      output += `<li class="list-group-item">Retailer address: <b>${result[7]}</b></li>`;
      output += `<li class="list-group-item">Consumer address: <b>${result[8]}</b></li>`;
      output += "</ul>";

      $resultEl.html(output);
    } catch (error) {
      this.addMessage(error.message ?? "Unknown error", "danger");
      console.error(error);
    }
  };

  handleHarvest = async (event) => {
    event.preventDefault();

    this.clearMessages();

    const formData = new FormData(event.target);

    const ups = formData.get("upc");
    const farmName = formData.get("farmName");
    const farmInformation = formData.get("farmInformation");
    const latitude = formData.get("latitude");
    const longitude = formData.get("longitude");
    const productNotes = formData.get("productNotes");

    if (!farmName || !farmInformation || !latitude || !longitude) {
      this.addMessage("All fields are required", "danger");
      return;
    }

    try {
      const tx = await this.instance.harvestItem(
        ups,
        farmName,
        farmInformation,
        latitude,
        longitude,
        productNotes,
        {
          from: this.metamaskAccountID,
        }
      );

      if (this.isDebug()) {
        console.log(tx);
      }

      this.addMessage(`Transaction hash: ${tx.tx}`, "success");
    } catch (error) {
      this.addMessage(error.message ?? "Unknown error", "danger");
      console.error(error);
    }
  };

  handleProcess = async (event) => {
    event.preventDefault();

    this.clearMessages();

    const formData = new FormData(event.target);

    const upc = formData.get("upc");

    if (!upc) {
      this.addMessage("UPC is required", "danger");
      return;
    }

    try {
      const tx = await this.instance.processItem(upc, {
        from: this.metamaskAccountID,
      });

      if (this.isDebug()) {
        console.log(tx);
      }

      this.addMessage(`Transaction hash: ${tx.tx}`, "success");
    } catch (error) {
      this.addMessage(error.message ?? "Unknown error", "danger");
      console.error(error);
    }
  };

  handlePack = async (event) => {
    event.preventDefault();

    this.clearMessages();

    const formData = new FormData(event.target);

    const upc = formData.get("upc");

    if (!upc) {
      this.addMessage("UPC is required", "danger");
      return;
    }

    try {
      const tx = await this.instance.packItem(upc, {
        from: this.metamaskAccountID,
      });

      if (this.isDebug()) {
        console.log(tx);
      }

      this.addMessage(`Transaction hash: ${tx.tx}`, "success");
    } catch (error) {
      this.addMessage(error.message ?? "Unknown error", "danger");
      console.error(error);
    }
  };

  handleSetForSale = async (event) => {
    event.preventDefault();

    this.clearMessages();

    const formData = new FormData(event.target);

    const upc = formData.get("upc");
    const price = formData.get("price");

    if (!upc || !price) {
      this.addMessage("UPC and price are required", "danger");
      return;
    }

    try {
      const tx = await this.instance.setForSaleItem(upc, price, {
        from: this.metamaskAccountID,
      });

      if (this.isDebug()) {
        console.log(tx);
      }

      this.addMessage(`Transaction hash: ${tx.tx}`, "success");
    } catch (error) {
      this.addMessage(error.message ?? "Unknown error", "danger");
      console.error(error);
    }
  };

  handleBuy = async (event) => {
    event.preventDefault();

    this.clearMessages();

    const formData = new FormData(event.target);

    const upc = formData.get("upc");

    if (!upc) {
      this.addMessage("UPC is required", "danger");
      return;
    }

    try {
      const { price } = await this.getItemInfo(upc);

      if (this.isDebug()) {
        console.log("price", price.toString());
      }

      if (!price) {
        this.addMessage("Price is not set", "danger");
        return;
      }

      // Convert to wei
      const value = Web3.utils.toWei(price.toString(), "ether");

      if (this.isDebug()) {
        console.log("value", value);
      }

      const tx = await this.instance.buyItem(upc, {
        value,
        from: this.metamaskAccountID,
      });

      if (this.isDebug()) {
        console.log(tx);
      }

      this.addMessage(`Transaction hash: ${tx.tx}`, "success");
    } catch (error) {
      this.addMessage(error.message ?? "Unknown error", "danger");
      console.error(error);
    }
  };

  handleShip = async (event) => {
    event.preventDefault();

    this.clearMessages();

    const formData = new FormData(event.target);

    const upc = formData.get("upc");

    if (!upc) {
      this.addMessage("UPC is required", "danger");
      return;
    }

    try {
      const tx = await this.instance.shipItem(upc, {
        from: this.metamaskAccountID,
      });

      if (this.isDebug()) {
        console.log(tx);
      }

      this.addMessage(`Transaction hash: ${tx.tx}`, "success");
    } catch (error) {
      this.addMessage(error.message ?? "Unknown error", "danger");
      console.error(error);
    }
  };

  handleReceive = async (event) => {
    event.preventDefault();

    this.clearMessages();

    const formData = new FormData(event.target);

    const upc = formData.get("upc");

    if (!upc) {
      this.addMessage("UPC is required", "danger");
      return;
    }

    try {
      const tx = await this.instance.receiveItem(upc, {
        from: this.metamaskAccountID,
      });

      if (this.isDebug()) {
        console.log(tx);
      }

      this.addMessage(`Transaction hash: ${tx.tx}`, "success");
    } catch (error) {
      this.addMessage(error.message ?? "Unknown error", "danger");
      console.error(error);
    }
  };

  handlePurchase = async (event) => {
    event.preventDefault();

    this.clearMessages();

    const formData = new FormData(event.target);

    const upc = formData.get("upc");

    if (!upc) {
      this.addMessage("UPC is required", "danger");
      return;
    }

    try {
      const { price } = await this.getItemInfo(upc);

      if (this.isDebug()) {
        console.log("price", price.toString());
      }

      if (this.isDebug()) {
        console.log("price", price);
      }

      if (!price) {
        this.addMessage("Price is not set", "danger");
        return;
      }

      // Convert to wei
      const value = Web3.utils.toWei(price.toString(), "ether");

      if (this.isDebug()) {
        console.log("value", value);
      }

      const tx = await this.instance.purchaseItem(upc, {
        value,
        from: this.metamaskAccountID,
      });

      if (this.isDebug()) {
        console.log(tx);
      }

      this.addMessage(`Transaction hash: ${tx.tx}`, "success");
    } catch (error) {
      this.addMessage(error.message ?? "Unknown error", "danger");
      console.error(error);
    }
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

  figureStatusLabel = (status) => {
    switch (status) {
      case this.statuses.Harvested:
        return "Harvested";
      case this.statuses.Processed:
        return "Processed";
      case this.statuses.Packed:
        return "Packed";
      case this.statuses.ForSale:
        return "For Sale";
      case this.statuses.Sold:
        return "Sold";
      case this.statuses.Shipped:
        return "Shipped";
      case this.statuses.Received:
        return "Received";
      case this.statuses.Purchased:
        return "Purchased";
      default:
        if (this.isDebug()) {
          console.log("figureStatusLabel", status);
        }

        return "Unknown";
    }
  };

  getItemInfo = async (upc) => {
    const result = await this.instance.fetchItemBufferTwo(upc);

    return {
      sku: result[0],
      upc: result[1],
      id: result[2],
      notes: result[3],
      price: result[4],
      status: result[5],
      distributor: result[6],
      retailer: result[7],
      consumer: result[8],
    };
  };

  getTransactionHistory = async () => {
    const response = await this.instance.getPastEvents("allEvents", {
      fromBlock: 0,
      toBlock: "latest",
    });

    if (this.isDebug()) {
      console.log(response);
    }

    const events = response.reverse();

    return events.map((event) => {
      return {
        name: event.event,
        transactionHash: event.transactionHash,
        blockNumber: event.blockNumber,
        returnValues: event.returnValues,
      };
    });
  };
}

$(window).on("load", function () {
  new App();
});
