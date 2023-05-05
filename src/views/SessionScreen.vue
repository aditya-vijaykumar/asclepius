<template>
  <div class="home">
    <div>
      <app-header> </app-header>
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
                  <p class="title is-4">Connected With</p>
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
      <p class="title is-3">Health Records List</p>
      <div class="center grid">
        <vs-row>
          <vs-col vs-type="flex" vs-justify="center" vs-align="center" w="3">
          </vs-col>
          <vs-col vs-type="flex" vs-justify="center" vs-align="center" w="6">
            <section>
              <b-table
                :data="recordsList"
                :checked-rows.sync="checkedRows"
                :checkable="checkableFlag"
                :checkbox-position="checkboxPosition"
                :checkbox-type="checkboxType"
              >
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
                  field="cid"
                  label="C-ID"
                  width="120"
                  centered
                  v-slot="props"
                >
                  <b-tooltip :label="props.row.id" type="is-dark" dashed>
                    {{ props.row.id.slice(0, 4) }}...{{
                      props.row.id.slice(-4)
                    }}
                  </b-tooltip>
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
                      @click="openRecord(props.row.id)"
                      >Open</b-button
                    >
                  </span>
                </b-table-column>
                <template #bottom-left>
                  <b>Total checked</b>: {{ checkedRows.length }}
                </template>
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
            <b-button
              v-if="checkableFlag"
              class="mb-5 mr-6"
              type="is-primary"
              @click="shareRecords"
              >Share Selected Records</b-button
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
        <b-icon
          pack="fas"
          icon="sync-alt"
          size="is-large"
          custom-class="fa-spin"
        >
        </b-icon>
      </b-loading>
    </b-notification>

    <br />
    <br />
    <app-footer></app-footer>
  </div>
</template>

<script>
// @ is an alias to /src
import AppHeader from "../layout/AppHeader.vue";
import AppFooter from "../layout/AppFooter.vue";
import { mapState } from "vuex";
import socket from "../utils/socket";
import CountDown from "@/components/CountDown.vue";

export default {
  name: "SessionScreen",
  components: {
    AppHeader,
    AppFooter,
    CountDown,
  },
  data() {
    return {
      isLoading: false,
      isFullPage: true,
      active: false,
      checkableFlag: true,
      records: [],
      search: "",
      socketUserID: "",
      inputSocketID: "",
      checkboxPosition: "left",
      checkboxType: "is-primary",
      checkedRows: [],
    };
  },
  methods: {
    async openRecord(id) {
      this.isLoading = true;
      this.$store
        .dispatch("decryptRecordWithState", { id })
        .then((boolFlag) => {
          this.isLoading = false;
          if (boolFlag) {
            this.success("Successfully decrypted the record, loading it now.");
            setTimeout(() => {
              const route = this.$router.resolve({ path: `/record/${id}` });
              window.open(route.href, "_blank");
            }, 1000);
          } else {
            this.danger("The connection request was rejected or timed out.");
          }
        })
        .catch(() => {
          this.isLoading = false;
          this.danger("The connection request was rejected or timed out.");
        });
    },
    async shareRecords() {
      try {
        console.log("Inside share records");
        console.log({ recordsToBeShared: this.checkedRows });
        this.checkableFlag = false;
        const flagg = await this.$store.dispatch(
          "shareSelectedRecordsInSession",
          {
            recordsToBeShared: this.checkedRows,
          }
        );
        console.log({ success: flagg });
      } catch (error) {
        console.error(error);
      }
    },
    async endSession() {
      try {
        console.log("Inside end session");
        this.$store.dispatch("endSession");
        this.danger("Session ended by you.");
        this.$router.push("/dashboard");
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
      this.$store.dispatch("endSession");
      this.danger("Session ended since the time has elapsed.");
      this.$router.push("/dashboard");
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
    });

    socket.on("connect request", ({ uName, uDid, uRole, from }) => {
      console.log("From: " + from);
      console.log("Content");
      console.log("Name: " + uName);
      console.log("DID: " + uDid);
      console.log("Role: " + uRole);
      this.confirmConnectAlert({ did: uDid, from: from, name: uName });
    });

    socket.on("connection accepted", ({ uName, uDid, uRole, encMsg, from }) => {
      console.log({ uName, uDid, uRole, encMsg, from });
      this.afterConnectionIsAccepted({ encMsg, from, uDid, uName });
    });

    socket.on("share new record", ({ recordData }) => {
      this.$store.dispatch("encryptStore", { record: recordData });
      this.success("New Health Record received, storing it on IPFS...");
    });

    socket.on("end session", () => {
      this.$store.dispatch("endSession");
      this.danger("Session ended by the doctor.");
      this.$router.push("/dashboard");
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
      if (event === "end session") {
        this.$store.dispatch("endSession");
        this.danger("Session ended by the doctor.");
        this.$router.push("/dashboard");
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
    ...mapState([
      "recordsList",
      "did",
      "ethaddress",
      "profile",
      "profile",
      "session",
    ]),
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
  background-image: url("../../public/ArtboardWide.jpg");
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
