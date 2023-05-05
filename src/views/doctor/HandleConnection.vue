<template>
  <div class="home">
    <div>
      <doc-app-header> </doc-app-header>
    </div>
    <div class="hero">
      <div class="overlay"></div>
      <div class="content">
        <h1></h1>
      </div>
    </div>
    <section class="section" id="general-info">
      <div class="tile is-ancestor">
        <div class="tile is-12 is-horizonal">
          <div class="tile is-vertical is-12 is-align-items-center">
            <div class="tile is-parent is-6">
              <article class="tile is-child notification is-danger">
                <p class="title">Your DID</p>
                <br />
                <p class="subtitle">{{ did }}</p>
                <div>
                  <!-- Content -->
                  <p class="title">WS Connection ID</p>
                  <br />
                  <p class="subtitle">{{ socketUserID }}</p>
                </div>
              </article>
            </div>

            <div class="tile is-6">
              <div class="tile is-parent is-vertical">
                <article class="tile is-child notification is-primary">
                  <p class="title">Connect</p>
                  <br />
                  <div class="con-form">
                    <p class="has-text-white">Scan this QR Code</p>
                    <canvas id="canvas"></canvas>
                  </div>
                  <br />
                  <p class="has-text-white">OR</p>
                  <h4 class="title is-5 has-text-white">Enter Session ID</h4>

                  <div class="tile is-justify-content-center">
                    <b-input v-model="inputSocketID"></b-input>
                  </div>
                  <b-button
                    class="mt-5"
                    type="is-white"
                    outlined
                    @click="establishConnectionWithAnother"
                    >Connect Now</b-button
                  >
                </article>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <b-notification :closable="false">
      <b-loading :is-full-page="isFullPage" v-model="isLoading">
      </b-loading>
    </b-notification>

    <b-modal
      v-model="qrModal"
      has-modal-card
      trap-focus
      :destroy-on-hide="false"
      aria-role="dialog"
      aria-label="Example Modal"
      close-button-aria-label="Close"
      aria-modal
    >
      <template>
        <qrcode-stream v-if="qrModal" @decode="onDecode" @init="onInit" />
      </template>
    </b-modal>

    <br />
    <br />
    <app-footer></app-footer>
  </div>
</template>

<script>
// @ is an alias to /src
import DocAppHeader from "../../layout/DocAppHeader.vue";
import AppFooter from "../../layout/AppFooter.vue";
import { mapState } from "vuex";
import socket from "../../utils/socket";
import QRcode from "qrcode";
import { QrcodeStream } from 'vue-qrcode-reader'


export default {
  name: "DashboardScreen",
  components: {
    DocAppHeader,
    AppFooter,
    QrcodeStream
  },
  data() {
    return {
      isLoading: false,
      isFullPage: true,
      qrModal: false,
      socketUserID: "",
      inputSocketID: "",
    };
  },
  methods: {
    async establishConnectionWithAnother() {
      try {
        console.log("Inside establishConnectionWithAnother");
        const to = this.inputSocketID;
        const payload = {
          to,
          uName: this.profile.name,
          uDid: this.did,
          uRole: "Doctor",
        };
        console.log({ payload });
        socket.emit("connect request", payload);
        this.isLoading = true;
        setTimeout(() => {
          if (this.isLoading) {
            this.isLoading = false;
            this.danger();
          }
        }, 30000);
      } catch (error) {
        console.error(error);
      }
    },
    createQRCode() {
      console.log(this.socketUserID);
      console.log(this.did);
      let text = JSON.stringify({
        sessionID: this.socketUserID,
        did: this.did,
      });
      let canvas = document.getElementById("canvas");

      QRcode.toCanvas(canvas, text, function (err) {
        if (err) console.error(err);
        console.log("successfully generated QR Code");
      });
    },
    onDecode(result) {
      console.log({ qrResult: result });
    },
    async onInit(promise) {
      try {
        await promise;
      } catch (error) {
        if (error.name === "NotAllowedError") {
          this.error = "ERROR: you need to grant camera access permission";
        } else if (error.name === "NotFoundError") {
          this.error = "ERROR: no camera on this device";
        } else if (error.name === "NotSupportedError") {
          this.error = "ERROR: secure context required (HTTPS, localhost)";
        } else if (error.name === "NotReadableError") {
          this.error = "ERROR: is the camera already in use?";
        } else if (error.name === "OverconstrainedError") {
          this.error = "ERROR: installed cameras are not suitable";
        } else if (error.name === "StreamApiNotSupportedError") {
          this.error = "ERROR: Stream API is not supported in this browser";
        } else if (error.name === "InsecureContextError") {
          this.error =
            "ERROR: Camera access is only permitted in secure context. Use HTTPS or localhost rather than HTTP.";
        } else {
          this.error = `ERROR: Camera error (${error.name})`;
        }
      }
    },
    confirmConnectAlert({ name, did, from }) {
      this.$buefy.dialog.confirm({
        title: "Received Connection Request",
        message: `Received connection request from account with Name: <b>${name}</b>, DID: <b>${did}</b> and has the role of <b>Patient</b>. Are you sure you want to <b>connect</b> and share details of your account? This action will start new session.`,
        confirmText: "Accept Request",
        type: "is-warning",
        hasIcon: true,
        onConfirm: () => this.onConfirmConnect({ name, did, from }),
      });
    },
    onConfirmConnect({ name, did, from }) {
      this.$store.dispatch("doctor/acceptConnection", { name, did, from });
      this.success();
    },
    danger() {
      this.$buefy.toast.open({
        duration: 5000,
        message: `The connection request was rejected or timed out.`,
        position: "is-bottom",
        type: "is-danger",
      });
    },
    success() {
      this.$router.push("/doctor/session");
      this.$buefy.toast.open({
        duration: 2000,
        message: `Successfully connected with the client, loading session now...`,
        position: "is-bottom",
        type: "is-success",
      });
    },
    afterConnectionIsAccepted({ uName, uDid, encMsg, from }) {
      this.isLoading = false;
      this.success();
      this.$store.dispatch("doctor/connectionAccepted", {
        from,
        did: uDid,
        name: uName,
        encMsg,
      });
    },
    sessionIDstore(takeID) {
      this.socketUserID = takeID;
    },
  },
  created() {
    const sessionID = localStorage.getItem("sessionID");

    if (sessionID != undefined) {
      socket.auth = { sessionID };
      socket.connect();
    } else {
      socket.auth = { did: this.did };
      socket.connect();

      console.log(socket.id);

      socket.on("session", ({ sessionID, userID }) => {
        // attach the session ID to the next reconnection attempts
        socket.auth = { sessionID };
        // store it in the localStorage
        localStorage.setItem("sessionID", sessionID);
        // save the ID of the user
        socket.userID = userID;
      });
    }

    socket.on("connect", () => {
      this.socketUserID = socket.id;
      console.log(socket.id);
      this.createQRCode();
    });

    socket.on("session", ({ sessionID, userID }) => {
      // attach the session ID to the next reconnection attempts
      socket.auth = { sessionID };
      // store it in the localStorage
      localStorage.setItem("sessionID", sessionID);
      // save the ID of the user
      socket.userID = userID;
    });

    socket.on("connect_error", (err) => {
      if (err.message === "invalid username") {
        this.usernameAlreadySelected = false;
      }
    });

    socket.on("connect request", ({ uName, uDid, uRole, from }) => {
      console.log({ uName, uDid, uRole, from });
      this.confirmConnectAlert({ did: uDid, from: from, name: uName });
    });

    socket.on("connection accepted", ({ uName, uDid, uRole, encMsg, from }) => {
      console.log({ uName, uDid, uRole, encMsg, from });
      this.afterConnectionIsAccepted({ encMsg, from, uDid, uName });
    });

    socket.onAny((event, ...args) => {
      console.log(event, args);
      // if (event == "connect request") {
      //   this.confirmConnectAlert({
      //     name: args[0].uName,
      //     did: args[0].uDid,
      //     role: args[0].uRole,
      //     from: args[0].from,
      //   });
      // } else
      // if (event === "connection accepted") {
      //   this.afterConnectionIsAccepted({
      //     encMsg: args[0].encMsg,
      //     from: args[0].from,
      //     uDid: args[0].uDid,
      //     uName: args[0].uName,
      //   });
      // }
      // if (event === "share records") {
      //   this.$store.dispatch("doctor/storeSharedRecords", {
      //     arrayOfRecords: args[0].arrayOfRecords,
      //   });
      // }
    });
    console.dir(socket);
  },
  mounted(){
    if (this.socketUserID == "") {
      this.sessionIDstore(socket.userID);
      this.createQRCode();
    }
  },
  destroyed() {
    socket.off("connect");
    socket.off("disconnect");
    socket.off("connect request");
    socket.off("connection accepted");
  },
  computed: {
    ...mapState("doctor", {
      recordsList: (state) => state.recordsList,
      did: (state) => state.did,
      ethaddress: (state) => state.ethaddress,
      profile: (state) => state.profile,
      profilePic: (state) => state.profilePic,
    }),
  },
};
</script>
<style scoped>
.mb-3 {
  margin-bottom: 3rem;
}

.hero {
  height: 550px;
  width: 100%;
  background-image: url("../../../public/ArtboardWide.jpg");
  background-size: cover;
  background-repeat: no-repeat;
  background-position: center;
  position: relative;
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-top: 10px;
  border-bottom-left-radius: 15px;
  border-bottom-right-radius: 15px;
}

.hero .overlay {
  background-color: #000;
  position: absolute;
  height: 100%;
  width: 100%;
  z-index: 1;
  left: 0;
  right: 0;
  top: 0;
  opacity: 0;
}

.hero .content {
  color: #fff;
  z-index: 2;
  text-align: center;
}

.hero .content h1 {
  font-size: 45px;
  font-weight: 700;
  font-family: "Montserrat", sans-serif;
}

.hero .content p {
  font-family: "Montserrat", sans-serif;
  font-size: 25px;
}
</style>
<style scoped>
h1 {
  font-weight: normal;
  font-size: 2.5em;
  margin: 25px auto;
  margin-top: 100px;
  width: 800px;
  text-align: center;
}

.content {
  margin: 0 auto;
  width: 400px;
  padding-top: 10px;
  color: black;
  position: relative;
  text-align: left;
}

img {
  border-radius: 50%;
  max-width: 12.5rem;
  height: 12.5rem;
  aspect-ratio: 1/1;
  object-fit: cover;
}

body,
button,
p {
  font-family: "Montserrat", sans-serif;
  font-weight: 500;
  letter-spacing: 1.4px;
  resize: none;
  color: rgb(0, 0, 0);
}
</style>
