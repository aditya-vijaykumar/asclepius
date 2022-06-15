import Vue from "vue";
import Vuex from "vuex";
import VuexPersistence from 'vuex-persist'
Vue.use(Vuex);

import { CeramicClient } from "@ceramicnetwork/http-client";
// Import DID client
import { DID } from "dids";
// import Web3 from "web3";

import { getResolver as getKeyResolver } from "key-did-resolver";
import { getResolver as get3IDResolver } from "@ceramicnetwork/3id-did-resolver";
import { EthereumAuthProvider, ThreeIdConnect } from "@3id/connect";

import { DataModel } from "@glazed/datamodel";
import { DIDDataStore } from "@glazed/did-datastore";
import { basicProfileModel as aliases } from "../utils/basicProfileModel";
import { ModelManager } from "@glazed/devtools";
import { model as basicProfileModel } from "@datamodels/identity-profile-basic";

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
    storeDID(state, payload) {
      state.did = payload.did;
      localStorage.setItem("did", payload.did);
    },
    onlyDIDLogout(state) {
      state.did = "";
      localStorage.setItem("did", null);
    },
  },
  actions: {
    async authenticateCeramic({commit}) {
      try {
        const ethereumProvider = await web3Modal.connect();
        console.log(ethereumProvider)
        console.log('selectedAddress '+ethereumProvider.selectedAddress)
        const addresses = await ethereumProvider.enable()
        console.log("addresses\n\n")
        const account = addresses[0]
        console.log(addresses)

        const authProvider = new EthereumAuthProvider(
          ethereumProvider,
          account
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
        commit("storeDID", {
          did: did.id,
        });
        return true;
      } catch (error) {
        console.log(error);
        return false;
      }
    },
    async schemas() {
      try {
        const manager = new ModelManager({ ceramic });
        manager.addJSONModel(basicProfileModel);

        console.log(basicProfileModel);
        console.log("\n");
        const aliases = await manager.deploy();
        console.log(aliases);
      } catch (error) {
        console.log(error);
      }
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
    async updateProfile({ commit }, payload) {
      const ethereumProvider = await web3Modal.connect();
      // Request accounts from the Ethereum provider
      ethereumProvider._portis.isLoggedIn().then(() => {
        console.log("Portis logged in");
      });

      console.log(ethereumProvider.portis.isLoggedIn());
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
      const model = new DataModel({ ceramic, aliases });
      const url = model.getSchemaURL();
      console.log(url);
      const dataStore = new DIDDataStore({ ceramic, model });
      console.log(profile);

      console.log("Logging from vuex");
      console.log(payload.selectedImage);

      let imgurl = await infuraUpload(payload.selectedImage);
      console.log(payload.imageWidth);
      console.log(payload.imageHeight);

      let imgSrc = {
        original: {
          src: imgurl,
          height: payload.imageHeight,
          width: payload.imageWidth,
          mimeType: payload.selectedImage.type,
        },
      };
      payload.profile.image = imgSrc;

      const profile = await dataStore.get("basicProfile", payload.profile);
      console.log(profile);

      setTimeout(() => {
        commit("updateProfile", { profile: profile });
      }, 2000);
    },
  },
  plugins: [new VuexPersistence().plugin]
});
async function infuraUpload(selectedImage) {
  let imgurl = null;

  if (selectedImage != null) {
    const file = await ipfs.add(selectedImage);
    console.log(file);
    imgurl = "ipfs://" + file.path;
    return imgurl;
  }
  return imgurl;
}
