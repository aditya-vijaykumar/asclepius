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
                <p class="title is-2">Session Established</p>
                <p class="title is-4">Session Till</p>
                <count-down
                  :endDate="new Date(Date.parse(session.connectedTill))"
                  :onceEnded="onceEnded"
                ></count-down>
                <div>
                  <!-- Content -->
                  <p class="title is-4">Your DID</p>
                  <p class="subtitle">{{ did }}</p>
                  <br />
                  <p class="title is-4">Connected With Patient</p>
                  <p class="subtitle">
                    <b> {{ session.name }} </b>
                    <small> ({{ session.did }}) </small>
                  </p>
                </div>
              </article>
            </div>
          </div>
        </div>
      </div>
    </section>
    <section>
      <p class="title is-3">Patient's Health Records List</p>
      <div class="center grid">
        <vs-row>
          <vs-col vs-type="flex" vs-justify="center" vs-align="center" w="3">
          </vs-col>
          <vs-col vs-type="flex" vs-justify="center" vs-align="center" w="6">
            <section>
              <b-table :data="recordsList">
                <b-table-column
                  field="id"
                  centered
                  label="ID"
                  width="40"
                  numeric
                  v-slot="props"
                >
                  {{ props.index + 1 }}
                </b-table-column>

                <b-table-column
                  field="first_name"
                  centered
                  width="200"
                  label="Record Title"
                  sortable
                  v-slot="props"
                >
                  {{ props.row.title }}
                </b-table-column>

                <b-table-column
                  field="date"
                  label="Date"
                  width="120"
                  centered
                  v-slot="props"
                >
                  <span>
                    <b-tag type="is-success"
                      >{{ new Date(props.row.date).toLocaleDateString() }}
                    </b-tag>
                  </span>
                </b-table-column>

                <b-table-column
                  label="Action"
                  centered
                  width="120"
                  v-slot="props"
                >
                  <span>
                    <b-button
                      size="is-small"
                      type="is-primary"
                      @click="openRecord(props.row.recordData)"
                      >Open</b-button
                    >
                  </span>
                </b-table-column>
              </b-table>
              <hr />
            </section>
          </vs-col>
          <vs-col vs-type="flex" vs-justify="center" vs-align="center" w="3">
          </vs-col>
          <vs-col
            vs-type="flex"
            vs-justify="center"
            vs-align="center"
            w="3"
            class="mb-3"
          >
            <b-button class="mb-5 mr-6" type="is-primary" @click="createRecord"
              >Create New Record</b-button
            >
            <b-button class="mb-5" type="is-danger" @click="endSession"
              >End Session</b-button
            >
          </vs-col>
        </vs-row>
      </div>
    </section>

    <b-notification :closable="false">
      <b-loading :is-full-page="isFullPage" v-model="isLoading">
        <!-- <b-icon
          pack="fas"
          icon="sync-alt"
          size="is-large"
          custom-class="fa-spin"
        >
        </b-icon> -->
      </b-loading>
    </b-notification>

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
import socket from "@/utils/socket";
import CountDown from "../../components/CountDown.vue";

export default {
  name: "DoctorSessionScreen",
  components: {
    DocAppHeader,
    AppFooter,
    CountDown,
  },
  data() {
    return {
      isLoading: false,
      isFullPage: true,
      active: false,
      waitingOnRecords: true,
      records: [],
    };
  },
  methods: {
    async openRecord(recordData) {
      this.isLoading = true;
      this.$store
        .dispatch("doctor/decryptRecordWithState", { recordData })
        .then((boolFlag) => {
          this.isLoading = false;
          if (boolFlag) {
            this.success("Successfully decrypted the record, loading it now.");
            setTimeout(() => {
              const route = this.$router.resolve({
                path: `/view-record`,
              });
              window.open(route.href, "_blank");
            }, 1000);
          } else {
            this.danger("Failed to decrypt the record, try again later.");
          }
        })
        .catch(() => {
          this.isLoading = false;
          this.danger("Failed to decrypt the record, try again later.");
        });
    },
    async createRecord() {
      try {
        console.log("Inside create record");
        this.$router.push("/doctor/new-record");
      } catch (error) {
        console.error(error);
      }
    },
    async endSession() {
      try {
        console.log("Inside end session");
        this.$store.dispatch("doctor/endSession");
        this.danger("Session ended by you.");
        this.$router.push("/doctor/dashboard");
      } catch (error) {
        console.error(error);
      }
    },
    danger(message) {
      this.$buefy.toast.open({
        duration: 5000,
        message: message,
        position: "is-bottom",
        type: "is-danger",
      });
    },
    success(message) {
      this.$buefy.toast.open({
        duration: 2000,
        message: message,
        position: "is-bottom",
        type: "is-success",
      });
    },
    sessionIDstore(takeID) {
      this.socketUserID = takeID;
    },
    onceEnded() {
      this.$store.dispatch("doctor/endSession");
      this.danger("Session ended since the time has elapsed.");
      this.$router.replace("/doctor/dashboard");
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

    if (socket != undefined) {
      if (this.waitingOnRecords && this.recordsList.length == 0) {
        this.isLoading = true;
      }
    } else {
      this.$router.push("/doctor/dashboard");
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

    socket.on("share records", ({ arrayOfRecords }) => {
      this.waitingOnRecords = false;
      console.log({ arrayOfRecords });
      this.$store.dispatch("doctor/storeSharedRecords", {
        arrayOfRecords: arrayOfRecords,
      });
      this.success("Receieved the records from patient.");
      this.isLoading = false;
    });
    socket.on("end session", () => {
      this.$store.dispatch("doctor/endSession");
      this.danger("Session ended by the patient.");
      this.$router.push("/doctor/dashboard");
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
      if (event === "share records") {
        this.waitingOnRecords = false;
        this.$store.dispatch("doctor/storeSharedRecords", {
          arrayOfRecords: args[0].arrayOfRecords,
        });
        this.isLoading = false;
      }
      if (event === "end session") {
        this.$store.dispatch("doctor/endSession");
        this.danger("Session ended by the patient.");
        this.$router.push("/doctor/dashboard");
      }
    });
    console.dir(socket);
    if (this.socketUserID == "") {
      this.sessionIDstore(socket.userID);
    }
  },
  destroyed() {
    socket.off("connect");
    socket.off("disconnect");
    socket.off("private message");
    socket.off("connect request");
  },
  computed: {
    ...mapState("doctor", {
      recordsList: (state) => state.recordsList,
      did: (state) => state.did,
      ethaddress: (state) => state.ethaddress,
      profile: (state) => state.profile,
      profilePic: (state) => state.profilePic,
      session: (state) => state.patientSession,
    }),
    abc: () => {
      console.log(this.checkedRows);
      return this.checkedRows;
    },
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
