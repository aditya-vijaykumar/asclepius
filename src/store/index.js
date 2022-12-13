import Vue from "vue";
import Vuex from "vuex";
import VuexPersistence from "vuex-persist";
Vue.use(Vuex);

import { DID } from "dids";
import { CeramicClient } from "@ceramicnetwork/http-client";
import { getResolver as getKeyResolver } from "key-did-resolver";
import { getResolver as get3IDResolver } from "@ceramicnetwork/3id-did-resolver";
import { EthereumAuthProvider, ThreeIdConnect } from "@3id/connect";

import { DataModel } from "@glazed/datamodel";
import { DIDDataStore } from "@glazed/did-datastore";
import { ModelManager } from "@glazed/devtools";
import { model as basicProfileModel } from "@datamodels/identity-profile-basic";
import { model as healthRecordsModel } from "./model.json";
import { convert as toLegacyIpld } from "blockcodec-to-ipld-format";
import * as dagJose from "dag-jose";
import { CID, create } from "ipfs-http-client";

import { ethers } from "ethers";
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
      id: process.env.VUE_APP_PORTIS_KEY, // required
    },
  },
  walletconnect: {
    package: WalletConnectProvider, // required
    options: {
      infuraId: process.env.VUE_APP_INFURA_KEY, // required
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
    didObj: {},
    didStoreObj: {},
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
      state.didObj = payload.didObj;
      state.didStoreObj = payload.didStoreObj;
      localStorage.setItem("did", payload.did);
    },
    storeProfile(state, payload) {
      if (payload.profile != null) {
        state.profile = payload.profile;
        let url = "https://ipfs.io/ipfs/";
        let cid = payload.profile.image?.original?.src?.slice(7);
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
      state.didObj = {};
      state.didStoreObj = {};
    },
  },
  actions: {
    async authenticateAndFetchData({ commit }) {
      try {
        const ethereumProvider = await web3Modal.connect();
        const provider = new ethers.providers.Web3Provider(ethereumProvider);
        const signer = provider.getSigner(0);

        const addressByProvider = await signer.getAddress();
        console.log(`addressByProvider: ${addressByProvider}`);
        // ethereumProvider._portis.isLoggedIn().then(() => {
        //   console.log("Portis logged in");
        // });
        // Request accounts from the Ethereum provider
        const accounts = await ethereumProvider.request({
          method: "eth_requestAccounts",
        });
        console.log(accounts[0]);
        console.log("selectedAddress " + ethereumProvider.selectedAddress);
        const addresses = await ethereumProvider.enable();
        console.log("addresses\n\n");
        // const account = addresses[0];
        console.log(addresses);

        const authProvider = new EthereumAuthProvider(
          provider.provider,
          addressByProvider
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

        const manager = new ModelManager({ ceramic });
        manager.addJSONModel(basicProfileModel);
        manager.addJSONModel(healthRecordsModel);
        const aliases = await manager.deploy();
        console.log(aliases);
        const model = new DataModel({ ceramic, aliases });
        const store = new DIDDataStore({ ceramic, model });

        const profile = (await store.get("basicProfile")) ?? {};
        console.log(profile);

        const allRecords = (await store.get("RecordsList")) ?? {
          records: [],
        };
        console.log(allRecords);
        commit("storeDID", {
          did: did.id,
          didObj: did,
          didStoreObj: store,
        });
        commit("storeProfileAndRecords", {
          profile,
          recordsList: allRecords.records,
        });
        console.log(profile);
        return true;
      } catch (error) {
        console.error(error);
        return false;
      }
    },
    async encryptStore({ commit, state }, payload) {
      try {
        //Storing the records
        const record = payload.record;

        // encrypt the record object
        const jwe = await state.didObj.createDagJWE(record, [state.didObj.id]);
        console.log(jwe);

        // put the JWE into the ipfs dag
        const jweCid = await ipfs.dag.put(jwe, {
          format: "dag-jose",
          hashAlg: "sha2-256",
        });

        console.log({ jweCid: jweCid.toString() });

        const recordsResp = (await state.didStoreObj.get("RecordsList")) ?? {
          records: [],
        };

        const recordsUpdated = await state.didStoreObj.set("RecordsList", {
          records: [
            {
              id: jweCid.toString(),
              title: payload.record.title,
              date: payload.record.date,
            },
            ...recordsResp.records,
          ],
        });

        console.log(recordsUpdated);

        const allRecords = (await state.didStoreObj.get("RecordsList")) ?? {
          records: [],
        };
        console.log(allRecords);

        commit("storeRecords", {
          recordsList: allRecords.records,
        });
        return true;
      } catch (error) {
        console.error(error);
        return false;
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
    async decryptRecordWithState({ commit, state }, payload) {
      try {
        console.log(payload);
        const jweCID = CID.parse(payload.id);
        console.log(jweCID);
        const dagJWE = await ipfs.dag.get(jweCID);
        console.log(dagJWE);
        const decryptedRecord = await state.didObj.decryptDagJWE(dagJWE.value);
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
    async updateProfile({ commit, state }, payload) {
      try {
        let imgurl = state.profilePic;
        let imgSrc = state.profile.image;
        if (payload.selectedImage) {
          imgurl = await infuraUpload(payload.selectedImage);
          imgSrc = {
            original: {
              src: imgurl,
              height: payload.imageHeight,
              width: payload.imageWidth,
              mimeType: payload.selectedImage.type,
            },
          };
        }
        payload.profile.image = imgSrc;

        await state.didStoreObj.set("basicProfile", payload.profile);
        const profile = await state.didStoreObj.get("basicProfile");
        console.log(profile);

        setTimeout(() => {
          commit("storeProfile", { profile: profile });
        }, 2000);
        return true;
      } catch (error) {
        console.error(error);
        return false;
      }
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
