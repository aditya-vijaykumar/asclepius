import Vue from "vue";
import Vuex from "vuex";
Vue.use(Vuex);

import { CeramicClient } from "@ceramicnetwork/http-client";
// Import DID client
import { DID } from "dids";

import { getResolver as getKeyResolver } from "key-did-resolver";
import { getResolver as get3IDResolver } from "@ceramicnetwork/3id-did-resolver";
import { EthereumAuthProvider, ThreeIdConnect } from "@3id/connect";

import { create } from "ipfs-http-client";

import Web3Modal from "web3modal";
import Portis from "@portis/web3";
import WalletConnectProvider from "@walletconnect/web3-provider";

// Connect to a Ceramic node
const API_URL = "https://ceramic-clay.3boxlabs.com";

// Create the Ceramic object
const ceramic = new CeramicClient(API_URL);
const threeID = new ThreeIdConnect();
const ipfs = create({
  host: "ipfs.infura.io",
  port: 5001,
  protocol: "https",
  headers: {
    authorization:
      "Basic " +
      Buffer.from(
        "2A4tKpAUqbVfcgwkvZhBVASwbrc" + ":" + "a636c461783951b90a023ee3e979daae"
      ).toString("base64"),
  },
});

export default new Vuex.Store({
  state: {
    authenticated: false,
    idx: {},
    ceramic: {},
    ipfs: {},
    recordsList: [],
    did: "",
    ethaddress: "",
    currentRecord: {},
    profile: {},
    profilePic: "",
  },
  getters: {
    records: (state) => state.recordsList.records,
  },
  mutations: {
    initialiseStore(state) {
      if (localStorage.getItem("ethaddress") != null) {
        state.ethaddress = localStorage.getItem("ethaddress");
      }

      if (localStorage.getItem("did") != null) {
        state.did = localStorage.getItem("did");
      }

      if (localStorage.getItem("profilePic") != null) {
        state.profilePic = localStorage.getItem("profilePic");
      }

      if (localStorage.getItem("recordsList") != null) {
        state.recordsList = JSON.parse(localStorage.getItem("recordsList"));
      }

      if (localStorage.getItem("authenticated")) {
        state.authenticated = true;
      }

      if (localStorage.getItem("currentRecord") != null) {
        state.currentRecord = JSON.parse(localStorage.getItem("currentRecord"));
      }
      if (localStorage.getItem("basicProfile") != null) {
        state.profile = JSON.parse(localStorage.getItem("basicProfile"));
      }
    },
    auth(state, payload) {
      state.ethaddress = payload.ethaddress;
      localStorage.setItem("ethaddress", payload.ethaddress);

      if (payload.profile != null) {
        state.profile = payload.profile;
        let url = "https://ipfs.io/ipfs/";
        let cid = payload.profile.image.original.src.slice(7);
        state.profilePic = url + cid;
        localStorage.setItem("profilePic", state.profilePic);
        localStorage.setItem("basicProfile", JSON.stringify(payload.profile));
      }

      state.did = payload.did;
      localStorage.setItem("did", payload.did);
      console.log("Mutation set");

      if (payload.recordList != null) {
        state.recordsList = payload.recordList.records;
        localStorage.setItem(
          "recordsList",
          JSON.stringify(payload.recordList.records)
        );
      }

      state.authenticated = true;
      localStorage.setItem("authenticated", true);

      console.log("mutation executed and state stored");
    },
    newRecord(state, payload) {
      state.recordsList = payload.recordList.records;
      localStorage.setItem(
        "recordsList",
        JSON.stringify(payload.recordList.records)
      );
    },
    updateProfile(state, payload) {
      state.profile = payload.profile;
      let url = "https://ipfs.io/ipfs/";
      let cid = payload.profile.image.original.src.slice(7);
      state.profilePic = url + cid;
      localStorage.setItem("profilePic", state.profilePic);
      localStorage.setItem("basicProfile", JSON.stringify(payload.profile));
    },
    currentRecord(state, payload) {
      state.currentRecord = payload.currentRecord;
      console.log(payload.currentRecord);
      localStorage.setItem(
        "currentRecord",
        JSON.stringify(payload.currentRecord)
      );
    },
    logoutTriggered(state) {
      state.ethaddress = "";
      localStorage.setItem("ethaddress", null);

      state.did = "";
      localStorage.setItem("did", null);

      state.profile = {};
      localStorage.setItem("basicProfile", null);

      state.recordsList = [];
      localStorage.setItem("recordsList", null);

      state.authenticated = false;
      localStorage.setItem("authenticated", false);

      console.log("User Logged out Succesfully");
    },
  },
  actions: {
    async authenticateCeramic() {
      const providerOptions = {
        portis: {
          package: Portis, // required
          options: {
            id: "c34c4e23-495d-4bfe-b5e6-9c3ea2de217a", // required
          },
        },
        walletconnect: {
          package: WalletConnectProvider, // required
          options: {
            infuraId: "e455e5fdffb8463295a0f641346994d8", // required
          },
        },
      };
      const web3Modal = new Web3Modal({
        network: "mainnet", // optional
        cacheProvider: true, // optional
        providerOptions, // required
      });
      const ethereumProvider = await web3Modal.connect();
      // Request accounts from the Ethereum provider
      const accounts = await ethereumProvider.request({
        method: "eth_requestAccounts",
      });
      // Create an EthereumAuthProvider using the Ethereum provider and requested account
      const authProvider = new EthereumAuthProvider(
        ethereumProvider,
        accounts[0]
      );
      // Connect the created EthereumAuthProvider to the 3ID Connect instance so it can be used to
      // generate the authentication secret
      await threeID.connect(authProvider);

      // const ceramic = new CeramicClient()
      const did = new DID({
        // Get the DID provider from the 3ID Connect instance
        provider: threeID.getDidProvider(),
        resolver: {
          ...get3IDResolver(ceramic),
          ...getKeyResolver(),
        },
      });

      // Authenticate the DID using the 3ID provider from 3ID Connect, this will trigger the
      // authentication flow using 3ID Connect and the Ethereum provider
      await did.authenticate();

      // The Ceramic client can create and update streams using the authenticated DID
      ceramic.did = did;
      console.log(did.id);
    },
    async encryptAndStore({ state }) {
      // const cleartext = { some: 'data', coolLink: new CID('bafyqacnbmrqxgzdgdeaui') }
      const cleartext = { some: "data" };

      // encrypt the cleartext object
      const jwe = await state.did.createDagJWE(cleartext, [
        "did:3:bafy89h4f9...",
        "did:key:za234...",
      ]);

      // put the JWE into the ipfs dag
      const jweCid = await ipfs.dag.put(jwe, {
        format: "dag-jose",
        hashAlg: "sha2-256",
      });
      console.log(jweCid);
      // get the jwe from the dag and decrypt it
      const dagJWE = await ipfs.dag.get(jweCid);
      console.log(await state.did.decryptDagJWE(dagJWE));
      // output:
      // > { some: 'data' }
    },
  },
});
// async function infuraUpload(selectedImage) {
//   let imgurl = null;

//   if (selectedImage != null) {
//     const file = await ipfs.add(selectedImage);
//     console.log(file);
//     imgurl = "ipfs://" + file.path;
//     return imgurl;
//   }
//   return imgurl;
// }
