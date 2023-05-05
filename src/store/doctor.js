import Vue from "vue";
import Vuex from "vuex";
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
import { create } from "ipfs-http-client";

import { ethers } from "ethers";
import Web3Modal from "web3modal";
import Portis from "@portis/web3";
import WalletConnectProvider from "@walletconnect/web3-provider";
import socket from "../utils/socket";

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

const whitelistedDoctorAddresses = ["0xb08138cb5f6ac6b908f0f70b72f8092eae12a9cd"];

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

export const doctorsModule = {
  namespaced: true,
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
    patientSession: {
      connected: false,
      did: "",
      name: "",
      userSocketId: "",
      connectedTill: null,
    },
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
      console.log(payload);
      if (payload.profile != null && Object.keys(payload.profile).length > 0) {
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
    pushNewRecord(state, payload) {
      state.recordsList.push(payload.record);
      localStorage.setItem("recordsList", state.recordsList);
    },
    storeProfileAndRecords(state, payload) {
      state.recordsList = payload.recordsList;
      localStorage.setItem("recordsList", payload.recordsList);
      console.log(payload);
      if (payload.profile != null && Object.keys(payload.profile).length > 0) {
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
      state.patientSession = {
        connected: false,
        did: "",
        name: "",
        userSocketId: "",
        connectedTill: null,
      };
    },
    storeConnectionDetails(state, payload) {
      state.patientSession = payload.session;
    },
    resetPatientSession(state) {
      state.patientSession = {
        connected: false,
        did: "",
        name: "",
        userSocketId: "",
        connectedTill: null,
      };
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
        if(whitelistedDoctorAddresses.findIndex(v => v == addresses[0]) == -1) {
          console.error("Address not whitelisted as a doctor.")
          return false;
        }

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
        console.log({did});

        const manager = new ModelManager({ ceramic });
        manager.addJSONModel(basicProfileModel);
        manager.addJSONModel(healthRecordsModel);
        const aliases = await manager.deploy();
        console.log(aliases);
        const model = new DataModel({ ceramic, aliases });
        const store = new DIDDataStore({ ceramic, model });

        const profile = (await store.get("basicProfile")) ?? {};
        console.log(profile);

        commit("storeDID", {
          did: did.id,
          didObj: did,
          didStoreObj: store,
        });
        commit("storeProfileAndRecords", {
          profile,
          recordsList: [],
        });
        console.log(profile);
        return true;
      } catch (error) {
        console.error(error);
        return false;
      }
    },
    async decryptRecordWithState({ commit, state }, payload) {
      try {
        console.log({ recordData: payload.recordData });
        const decryptedRecord = await state.didObj.decryptDagJWE(
          payload.recordData
        );
        console.log({ decryptedRecord });
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
    async connectionAccepted({ commit, state }, payload) {
      try {
        const { from, did, name, encMsg } = payload;
        const jwe = await state.didObj.decryptDagJWE(encMsg);
        console.log({ jwe });
        const connectedTillDateString = jwe.connectedTill;
        console.log({ connectedTillDateString });

        console.log({
          session: {
            connected: true,
            did: did,
            name: name,
            userSocketId: from,
            connectedTill: connectedTillDateString,
          },
        });

        commit("storeConnectionDetails", {
          session: {
            connected: true,
            did: did,
            name: name,
            userSocketId: from,
            connectedTill: connectedTillDateString,
          },
        });
        console.log({ storeSession: state.patientSession });

        return true;
      } catch (error) {
        console.error(error);
        return false;
      }
    },
    async acceptConnection({ commit, state }, payload) {
      try {
        const { from, did, name } = payload;
        // Get the current timestamp in milliseconds
        const now = new Date().getTime();
        // Add 60 minutes (60 * 60 * 1000 milliseconds) to the current timestamp
        const timestamp60MinFromNow = now + 60 * 60 * 1000;
        // Convert the timestamp to a Date object
        const date60MinFromNow = new Date(timestamp60MinFromNow);

        console.log({ did, from , date60MinFromNow});
        commit("storeConnectionDetails", {
          session: {
            connected: true,
            did: did,
            name: name,
            userSocketId: from,
            connectedTill: date60MinFromNow.toString(),
          },
        });
        const jwe = await state.didObj.createDagJWE(
          { connectedTill: date60MinFromNow.toString() },
          [state.didObj.id, did]
        );
        console.log({ jwe });
        socket.emit("connection accepted", {
          uName: state.profile.name,
          uDid: state.did,
          uRole: "doctor",
          encMsg: jwe,
          to: from,
        });
        console.log({ storeSession: state.patientSession });
      } catch (error) {
        console.error(error);
      }
    },
    async storeSharedRecords({ commit }, payload) {
      const { arrayOfRecords } = payload;
      commit("storeRecords", { recordsList: arrayOfRecords });
      // for (let i = 0; i < arrayOfRecords.length; i++) {
      //   const rec = arrayOfRecords[i];
      //   const decryptedRecord = await state.didObj.decryptDagJWE(rec.recordData);
      //   console.log({i, ...rec, decryptedRecord})
      // }
    },
    async createSignShareNewRecord({ commit, state }, payload) {
      try {
        const record = payload.record;

        const { jws } = await state.didObj.createDagJWS(record);

        // encrypt the record object
        const recordDataToShare = await state.didObj.createDagJWE(
          { ...record, signatureByDoc: jws, didOfDoc: state.did },
          [state.patientSession.did]
        );
        const recordDataForSession = await state.didObj.createDagJWE(record, [
          state.did,
        ]);
        console.log({ recordDataToShare });
        const newRecordData = {
          recordData: recordDataToShare,
          title: payload.record.title,
          date: payload.record.date,
        };
        commit("pushNewRecord", {
          record: {
            recordData: recordDataForSession,
            title: payload.record.title,
            date: payload.record.date,
          },
        });
        socket.emit("share new record", {
          recordData: newRecordData,
          to: state.patientSession.userSocketId,
        });
        return true;
      } catch (error) {
        console.error(error);
        return false;
      }
    },
    async endSession({ commit, state }) {
      try {
        socket.emit("end session", { to: state.patientSession.userSocketId });
        commit("resetPatientSession");
        return true;
      } catch (error) {
        console.error(error);
        return false;
      }
    },
  },
};

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
