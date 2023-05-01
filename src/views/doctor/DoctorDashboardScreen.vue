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
        <div class="tile is-vertical is-8">
          <div class="tile is-parent">
            <article class="tile is-child notification is-danger">
              <p class="title">Your DID</p>
              <br />
              <p class="subtitle">{{ did }}</p>
              <div class="content">
                <!-- Content -->
              </div>
            </article>
          </div>

          <div class="tile">
            <div class="tile is-parent is-vertical">
              <article class="tile is-child notification is-primary">
                <p class="title">WS Connection ID</p>
                <br />
                <p class="subtitle">{{ socketUserID }}</p>
              </article>
            </div>
            <div class="tile is-parent is-vcentered">
              <article class="tile is-child notification is-info">
                <p class="title center">Connect &amp; Share</p>
                <p style="color: #fff">
                  Connect and share your records with a doctor or another user
                  through a secured websockets connection.
                </p>
                <br />

                <b-tooltip
                  type="is-dark"
                  label="This QR Code is valid only for a few minutes."
                >
                  <b-button
                    label="Start"
                    type="is-dark"
                    size="is-medium"
                    @click="$router.push('/doctor/connect')"
                  />
                </b-tooltip>
              </article>
            </div>
          </div>
        </div>

        <div class="tile is-parent">
          <article class="tile is-child notification is-warning">
            <div class="content">
              <p class="title center">Your Profile</p>
              <div
                class="screen-body-item"
                v-if="profile != undefined && profile.name != null"
              >
                <div class="img-circle center">
                  <img :src="profilePic" alt="profile-image" />
                  <!-- <img src="" alt="profile-image" /> -->
                </div>
                <br />
                <div class="app-form center">
                  <h5>{{ profile.name }}</h5>
                </div>
              </div>
              <div class="screen-body-item" v-else>
                <p>
                  Your Profile doesn't exist or hasn't been initialized
                  properly, please click on edit and update your profile.
                </p>
              </div>
              <div class="content">
                <!-- Content -->
              </div>
            </div>
          </article>
        </div>
      </div>
    </section>

    <!-- <div class="center">
              <vs-dialog v-model="active">
                  <template #header>
                      <h4 class="not-margin">QR COde <b>Generator</b></h4>
                  </template>
  
                  <div class="con-form">
                      <canvas id="canvas"></canvas>
                  </div>
  
                  <template #footer>
                      <div class="footer-dialog">
                          <vs-button block @click="createQRCode">
                              Generate QR Code
                          </vs-button>
                      </div>
                  </template>
              </vs-dialog>
          </div> -->

    <b-loading :is-full-page="isFullPage" v-model="isLoading"> </b-loading>

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

export default {
  name: "DashboardScreen",
  components: {
    DocAppHeader,
    AppFooter,
  },
  data() {
    return {
      isLoading: false,
      isFullPage: true,
      active: false,
      records: [],
      search: "",
      socketUserID: "",
      data: [
        {
          id: 1,
          first_name: "General Health Checkup",
          date: "2016-10-15 13:43:27",
        },
        { id: 2, first_name: "Seasonal Flu", date: "2016-12-15 06:00:53" },
        { id: 3, first_name: "Migraine", date: "2016-04-26 06:26:28" },
        { id: 4, first_name: "Common Cold", date: "2016-04-10 10:28:46" },
        { id: 5, first_name: "Injured Ankle", date: "2016-12-06 14:38:38" },
      ],
      columns: [
        {
          field: "id",
          label: "ID",
          width: "100",
          numeric: true,
          searchable: true,
        },
        {
          field: "first_name",
          label: "Record Title",
          searchable: true,
        },
        {
          field: "date",
          label: "Date",
          centered: true,
        },
        {
          field: "gender",
          label: "Action",
        },
      ],
    };
  },
  methods: {
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
    alertCustom() {
      // this.$buefy.dialog.alert({
      //   title: "QR Code Generator",
      //   message:
      //     '<div class="con-form">< canvas id="canvas" ></canvas></div><vs-button block @click="createQRCode">',
      // });
    },
    openLoading() {
      const loading = this.$vs.loading();
      setTimeout(() => {
        loading.close();
      }, 3000);
    },
    sessionIDstore(takeID) {
      this.socketUserID = takeID;
    },
    danger() {
      this.$buefy.toast.open({
        duration: 5000,
        message: `Could not decrypt the record, please try again later.`,
        position: "is-bottom",
        type: "is-danger",
      });
    },
    success() {
      this.$buefy.toast.open({
        duration: 2000,
        message: `Successfully decrypted the record, loading it now.`,
        position: "is-bottom",
        type: "is-success",
      });
    },
    async openRecord(id) {
      this.isLoading = true;
      this.$store
        .dispatch("doctor/decryptRecordWithState", { id })
        .then((boolFlag) => {
          this.isLoading = false;
          if (boolFlag) {
            this.success();
            setTimeout(() => {
              this.$router.push("/doctor/record/" + id);
            }, 1000);
          } else {
            this.danger();
          }
        })
        .catch(() => {
          this.isLoading = false;
          this.danger();
        });
      // .then((bool;
      // let route = this.$router.resolve({ path: "/content/" + id });
      // setTimeout(() => {
      //     loading.close();
      //     window.open(route.href, "_self");
      // }, 9000);
    },
    async retrieveDispatch(Pname, cid) {
      let payload = {
        cid: cid,
        name: Pname,
      };
      console.log(payload);
      const loading = this.$vs.loading();
      await this.$store.dispatch("doctor/retireve", payload);
      setTimeout(() => {
        loading.close();
      }, 3000);
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

    socket.on("private message", ({ Pname, cid, from }) => {
      console.log("From: " + from);
      console.log("Content");
      console.log(Pname);
      console.log(cid);
      this.retrieveDispatch(Pname, cid);
    });

    socket.onAny((event, ...args) => {
      console.log(event, args);
    });
    console.dir(socket);
  },
  destroyed() {
    socket.off("connect");
    socket.off("disconnect");
    socket.off("private message");
  },
  computed: {
    //   ...mapState(["recordsList", "did", "ethaddress", "profile", "profile"]),
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
