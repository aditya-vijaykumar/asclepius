import Vue from "vue";
import Vuex from "vuex";
import VuexPersistence from "vuex-persist";
// import modelAliases from "./model.json";
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
// import { basicProfileModel as aliases } from "../utils/basicProfileModel";
import { ModelManager } from "@glazed/devtools";
import { model as basicProfileModel } from "@datamodels/identity-profile-basic";
import { model as healthRecordsModel } from "./model.json";
import { convert as toLegacyIpld } from "blockcodec-to-ipld-format";
import * as dagJose from "dag-jose";

import { CID, create } from "ipfs-http-client";
// import { prepareCleartext } from "dag-jose-utils";

import Web3Modal from "web3modal";
import Portis from "@portis/web3";
import WalletConnectProvider from "@walletconnect/web3-provider";

// Connect to a Ceramic node
// const API_URL = "https://ceramic-clay.3boxlabs.com";
const API_URL = "http://localhost:7007/";

// Create the Ceramic object
const ceramic = new CeramicClient(API_URL);
const threeID = new ThreeIdConnect();

const dagJoseIpldFormat = toLegacyIpld(dagJose);
const ipfs = create({
  host: "ipfs.infura.io",
  port: 5001,
  protocol: "https",
  headers: {
    authorization:
      "Basic " +
      Buffer.from(
        process.env.VUE_APP_IPFS_KEY + ":" + process.env.VUE_APP_IPFS_SECRET
      ).toString("base64"),
  },
  ipld: { formats: [dagJoseIpldFormat] },
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
    profile: {
      name: "",
      description: "",
      gender: "",
      homeLocation: "",
      birthDate: null,
      image: null,
    },
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
    storeProfile(state, payload) {
      if (payload.profile != null) {
        state.profile = payload.profile;
        let url = "https://ipfs.io/ipfs/";
        let cid = payload.profile.image.original.src.slice(7);
        state.profilePic = url + cid;
        localStorage.setItem("profilePic", state.profilePic);
        localStorage.setItem("basicProfile", JSON.stringify(payload.profile));
      }
    },
    storeRecords(state, payload) {
      state.recordsList = payload.recordsList;
      localStorage.setItem("recordsList", payload.recordsList);
    },
    storeProfileAndRecords(state, payload) {
      state.recordsList = payload.recordsList;
      localStorage.setItem("recordsList", payload.recordsList);
      if (payload.profile != null) {
        state.profile = payload.profile;
        let url = "https://ipfs.io/ipfs/";
        let cid = payload.profile.image.original.src.slice(7);
        state.profilePic = url + cid;
        localStorage.setItem("profilePic", state.profilePic);
        localStorage.setItem("basicProfile", JSON.stringify(payload.profile));
      }
    },
    currentRecord(state, payload) {
      state.currentRecord = payload.currentRecord;
      console.log(payload.currentRecord);
      localStorage.setItem(
        "currentRecord",
        JSON.stringify(payload.currentRecord)
      );
    },
    onlyDIDLogout(state) {
      state.did = "";
      localStorage.setItem("did", null);
    },
    logout(state) {
      state.did = "";
      state.currentRecord = {};
      state.profile = {};
      state.recordsList = [];
      state.profilePic = "";
    },
  },
  actions: {
    async authenticateCeramic({ commit }) {
      try {
        const ethereumProvider = await web3Modal.connect();
        console.log(ethereumProvider);
        console.log("selectedAddress " + ethereumProvider.selectedAddress);
        const addresses = await ethereumProvider.enable();
        console.log("addresses\n\n");
        const account = addresses[0];
        console.log(addresses);

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
    async testSchemas() {
      try {
        const ethereumProvider = await web3Modal.connect();
        console.log(ethereumProvider);
        console.log("selectedAddress " + ethereumProvider.selectedAddress);
        const addresses = await ethereumProvider.enable();
        console.log("addresses\n\n");
        const account = addresses[0];
        console.log(addresses);

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

        // console.log(modelAliases);
        const manager = new ModelManager({ ceramic });
        manager.addJSONModel(basicProfileModel);
        manager.addJSONModel(healthRecordsModel);

        console.log(healthRecordsModel);

        const aliases = await manager.deploy();

        // const aliases = {
        //   schemas: {
        //     HealthRecordsSchema:
        //       "ceramic://k3y52l7qbv1frydfi8cnwenycbcijktr8br1pdgwwdaoe6mpwmyvj8bebxt6raneo",
        //   },
        //   definitions: {
        //     RecordsList:
        //       "k3y52l7qbv1frxozbetu4jrwakdq2zrdkm82phy5gjomptp2f49b7u0alljckbocg",
        //   },
        //   tiles: {},
        // };
        console.log(aliases);

        const model = new DataModel({ ceramic, aliases });
        console.log(model);

        console.log(model.getSchemaURL("HealthRecordsSchema"));
        console.log(model.getDefinitionID("RecordsList"));
        const store = new DIDDataStore({ ceramic, model });
        console.log(store);
        await store.set("basicProfile", {
          name: "Abraham Benjamin DeVillers",
        });
        const profile = await store.get("basicProfile");
        console.log(profile);
      } catch (error) {
        console.error(error);
      }
    },
    async schemas() {
      try {
        const manager = new ModelManager({ ceramic });
        manager.addJSONModel(basicProfileModel);

        console.log(basicProfileModel);
        console.log("\n");
        const resp = await manager.createSchema("MySchema", {
          $schema: "http://json-schema.org/draft-07/schema#",
          title: "MySchema",
          type: "object",
          properties: {
            records: {
              type: "array",
              title: "records",
              items: {
                type: "object",
                properties: {
                  id: {
                    type: "string",
                    title: "rId",
                  },
                  title: {
                    type: "integer",
                    title: "title",
                  },
                },
              },
            },
          },
        });

        console.log(resp);

        const model = manager.toJSON();

        console.log("\n");
        console.log(model);

        // const aliases = await manager.deploy();
        // console.log(aliases);
      } catch (error) {
        console.log(error);
      }
    },
    async encryptAndStore() {
      try {
        const ethereumProvider = await web3Modal.connect();
        console.log(ethereumProvider);
        console.log("selectedAddress " + ethereumProvider.selectedAddress);
        const addresses = await ethereumProvider.enable();
        console.log("addresses\n\n");
        const account = addresses[0];
        console.log(addresses);

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
        const cleartext = { some: "data" };
        // const cleartext = await prepareCleartext({ some: "data", coolLink: new CID('bafyqacnbmrqxgzdgdeaui') });

        // encrypt the cleartext object
        const jwe = await did.createDagJWE(cleartext, [did.id]);
        console.log(jwe);

        // put the JWE into the ipfs dag
        const jweCid = await ipfs.dag.put(jwe, {
          format: "dag-jose",
          hashAlg: "sha2-256",
        });
        // const idOfJweCid = jweCid.toString();
        // console.log(idOfJweCid);
        // get the jwe from the dag and decrypt it
        // const creatingCID = new CID(idOfJweCid)
        // console.log(creatingCID)
        const dagJWE = await ipfs.dag.get(jweCid);
        console.log(dagJWE);
        const decryptedStuff = await did.decryptDagJWE(dagJWE.value);
        console.log(decryptedStuff);
        // output:
        // > { some: 'data' }
      } catch (error) {
        console.error(error);
      }
    },
    async decryptRecord({ commit }, payload) {
      try {
        const ethereumProvider = await web3Modal.connect();
        console.log(ethereumProvider);
        console.log("selectedAddress " + ethereumProvider.selectedAddress);
        const addresses = await ethereumProvider.enable();
        console.log("addresses\n\n");
        const account = addresses[0];
        console.log(addresses);

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

        console.log(payload);
        const jweCID = CID.parse(payload.id);
        console.log(jweCID);
        const dagJWE = await ipfs.dag.get(jweCID);
        console.log(dagJWE);
        const decryptedRecord = await did.decryptDagJWE(dagJWE.value);
        console.log(decryptedRecord);
        commit("currentRecord", { currentRecord: decryptedRecord });

        if (decryptedRecord != null) {
          return true;
        }
        return false;
      } catch (error) {
        console.error(error);
        return false;
      }
    },
    async updateProfile({ commit }, payload) {
      const ethereumProvider = await web3Modal.connect();
      console.log(ethereumProvider);
      console.log("selectedAddress " + ethereumProvider.selectedAddress);
      const addresses = await ethereumProvider.enable();
      console.log("addresses\n\n");
      const account = addresses[0];
      console.log(addresses);

      const authProvider = new EthereumAuthProvider(ethereumProvider, account);
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

      const manager = new ModelManager({ ceramic });
      manager.addJSONModel(basicProfileModel);
      const aliases = await manager.deploy();
      console.log(aliases);
      const model = new DataModel({ ceramic, aliases });
      const store = new DIDDataStore({ ceramic, model });

      console.log("Logging from vuex");

      let imgurl = await infuraUpload(payload.selectedImage);
      console.log(payload.imageWidth);
      console.log(payload.imageHeight);

      console.log(imgurl);

      let imgSrc = {
        original: {
          src: imgurl,
          height: payload.imageHeight,
          width: payload.imageWidth,
          mimeType: payload.selectedImage.type,
        },
      };
      payload.profile.image = imgSrc;

      const profile = await store.set("basicProfile", payload.profile);
      console.log(profile);

      setTimeout(() => {
        commit("storeProfile", { profile: profile });
      }, 2000);
    },
  },
  plugins: [new VuexPersistence().plugin],
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
