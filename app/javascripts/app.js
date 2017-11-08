// Import the page's CSS. Webpack will know what to do with it.
import "../stylesheets/app.css";

// Import libraries we need.
import { default as Web3} from 'web3';
import { default as contract } from 'truffle-contract'

// Import our contract artifacts and turn them into usable abstractions.
import docverify_artifacts from '../../build/contracts/DocVerify.json'

// MetaCoin is our usable abstraction, which we'll use through the code below.
var DocVerify = contract(docverify_artifacts);

// The following code is simple to show off interacting with your contracts.
// As your needs grow you will likely need to change its form and structure.
// For application bootstrapping, check out window.addEventListener below.
var accounts;
var account;
var userBalance;

var contractInstance;
var docHash;


window.App = {
  start: function() {
    var self = this;

    // Bootstrap the DocVerify abstraction for Use.
    DocVerify.setProvider(web3.currentProvider);

    // Get the initial account balance so it can be displayed.
    web3.eth.getAccounts(function(err, accs) {
      if (err != null) {
        alert("There was an error fetching your accounts.");
        return;
      }

      if (accs.length == 0) {
        alert("Couldn't get any accounts! Make sure your Ethereum client is configured correctly.");
        return;
      }

      accounts = accs;
      account = accounts[0];

      var htmlUserAddr = document.getElementById("user_address");
      htmlUserAddr.innerHTML = account;

      App.refreshUserBalance();
    });

    contractInstance = DocVerify.deployed();

    contractInstance.then(function(instance) {
      return instance.address;
    }).then(function(address) {
      console.log("Contract Address", address);
      var htmlAddr = document.getElementById("address");
      htmlAddr.innerHTML = address;
    });

    App.refreshDocNumber();
  },

  setStatus: function(message) {
    var status = document.getElementById("status");
    status.innerHTML = message;
  },

  refreshUserBalance: function() {
    var self = this;

    web3.eth.getBalance(account, function(err, res) {
      if (err) {
        console.log(error);
        return;
      }

      var balance = res.toNumber();
      userBalance = web3.fromWei(balance, 'ether')
      console.log("User Balance", userBalance);

      var htmlBalance = document.getElementById("user_balance");
      htmlBalance.innerHTML = userBalance;
    })
  },

  refreshDocNumber: function() {
    contractInstance.then(function(instance) {
      var docVerify = instance;
      return docVerify.numDocuments.call();
    }).then(function(response) {
      console.log("Number of Documents:", response.toNumber());
      var htmlNumDocs = document.getElementById("numdocs");
      htmlNumDocs.innerHTML = response.toNumber();
    });
  },

  progress: function(p) {
    var w = ((p*100).toFixed(0));
  },

  finished: function(result) {
    console.log(result.toString(CryptoJSH.enc.Hex))
    docHash = result.toString(CryptoJSH.enc.Hex);
    var htmlDocHash = document.getElementById("doc_hash");
    htmlDocHash.innerHTML = docHash;

    App.setStatus("Hash calculaton done");
  },

  calculateHash: function() {
    var self = this;

    self.setStatus("Calculating Hash");

    var file = document.getElementById('fileUpload').files[0]
    var reader = new FileReader();
    reader.onload = function(e) {
      var data = e.target.result;
      var res = CryptoJSH.SHA256(data, App.progress, App.finished);
    };
    reader.readAsBinaryString(file)
  },

  submitDocument: function() {
    var self = this;

    // self.setStatus("Submitting document... (please wait)");

    contractInstance.then(function(instance) {
      var docVerify = instance;

      docVerify.newDocument(docHash, { from: account }).then(
        function(success) {
          console.log(success);
        }
      );

      // Good only when transaction occured
      // docVerify.documentExists.call(docHash).then(function(exists) {
      //   if (exists) {
      //     App.setStatus("Document hash submitted");
      //   }
      //   else {
      //     App.setStatus("Error in submitting document hash");
      //   }
      // });
    });

    App.refreshUserBalance();
    App.refreshDocNumber();
  },

  verifyDocument: function() {
    var self = this;

    App.setStatus("Verifying document... (please wait)");

    contractInstance.then(function(instance) {
      var docVerify = instance;

      docVerify.documentExists.call(docHash).then(function(exists) {
        if (exists) {
          docVerify.getDocument.call(docHash).then(function(result) {
            var date = new Date(result[0].toNumber() * 1000);
            var dateString = date.toGMTString();

            var docDetails = "Document registered: " + dateString
                            + "<br>Document owner: " + result[1];
            App.setStatus(docDetails);
          });
        }
      });

    });
  }
};

window.addEventListener('load', function() {
  // Checking if Web3 has been injected by the browser (Mist/MetaMask)
  if (typeof web3 !== 'undefined') {
    console.warn("Using web3 detected from external source. If you find that your accounts don't appear or you have 0 MetaCoin, ensure you've configured that source properly. If using MetaMask, see the following link. Feel free to delete this warning. :) http://truffleframework.com/tutorials/truffle-and-metamask")
    // Use Mist/MetaMask's provider
    window.web3 = new Web3(web3.currentProvider);
  } else {
    console.warn("No web3 detected. Falling back to http://localhost:9545. You should remove this fallback when you deploy live, as it's inherently insecure. Consider switching to Metamask for development. More info here: http://truffleframework.com/tutorials/truffle-and-metamask");
    // fallback - use your fallback strategy (local node / hosted node + in-dapp id mgmt / fail)
    window.web3 = new Web3(new Web3.providers.HttpProvider("http://localhost:9545"));
  }

  App.start();
});
