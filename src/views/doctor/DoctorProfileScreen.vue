<template>
  <div class="home">
    <div class="mb-3">
      <doc-app-header> </doc-app-header>
    </div>

    <div class="background">
      <div class="container">
        <div class="screen">
          <div class="screen-body">
            <div class="screen-body-item left">
              <div class="app-title">
                <span>YOUR</span>
                <span>PROFILE</span>
              </div>
              <div class="app-contact">Powered By IDX</div>
            </div>
            <div
              class="screen-body-item"
              v-if='profile != undefined && profile.name != null && profile.name != ""'
            >
              <div class="img-circle">
                <img :src="profilePic" alt="profile-image" />
              </div>
              <div class="app-form">
                <div class="app-form-group">
                  <p>{{ profile.name }}</p>
                </div>
                <div class="app-form-group">
                  <p>{{ profile.gender }}</p>
                </div>
                <div class="app-form-group">
                  <p>{{ profile.birthDate }}</p>
                </div>
                <div class="app-form-group">
                  <p>{{ profile.homeLocation }}</p>
                </div>
                <div class="app-form-group">
                  <p>{{ profile.description }}</p>
                </div>
              </div>
              <div class="app-form-group buttons">
                <button class="app-form-button" @click="home">HOME</button>
                <button class="app-form-button"></button>
                <button class="app-form-button" @click="editProfile">
                  EDIT
                </button>
              </div>
            </div>
            <div class="screen-body-item" v-else>
              <p>
                Your Profile doesn't exist or hasn't been initialized properly,
                please click on edit and update your profile.
              </p>
              <div class="app-form-group buttons">
                <button class="app-form-button" @click="home">HOME</button>
                <button class="app-form-button"></button>
                <button class="app-form-button" @click="editProfile">
                  EDIT
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
// @ is an alias to /src
import DocAppHeader from "@/layout/DocAppHeader.vue";
import { mapState } from "vuex";

export default {
  name: "DoctorProfileScreen",
  components: {
    DocAppHeader,
  },
  data() {
    return {
      src: "https://www.w3schools.com/howto/img_avatar2.png",
    };
  },
  methods: {
    home() {
      this.$router.back();
    },
    editProfile() {
      this.$router.push("/doctor/edit-profile");
    },
  },
  computed: {
    ...mapState("doctor", {
      did: (state) => state.did,
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
  width: 600px;
  padding-top: 40px;
  color: black;
  position: relative;
  text-align: left;
}

*,
*:before,
*:after {
  box-sizing: border-box;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

body {
  background: linear-gradient(to right, #ebad27 0%, #ffb000 100%);
  font-size: 12px;
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
  color: #fff;
}

.background {
  display: flex;
  min-height: 100vh;
}

.container {
  flex: 0 1 800px;
  margin: auto;
  padding: 10px;
  margin-top: 50px;
}

.screen {
  position: relative;
  background: #3e3e3e;
  border-radius: 15px;
}

.screen:after {
  content: "";
  display: block;
  position: absolute;
  top: 0;
  left: 20px;
  right: 20px;
  bottom: 0;
  border-radius: 15px;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.4);
  z-index: -1;
}

.screen-body {
  display: flex;
}

.screen-body-item {
  flex: 4;
  padding: 50px;
}

.screen-body-item.left {
  display: flex;
  flex: 1;
  flex-direction: column;
}

.app-title {
  display: flex;
  flex-direction: column;
  position: relative;
  color: #ffb000;
  font-size: 26px;
  text-align: left;
}

.app-title:after {
  content: "";
  display: block;
  position: absolute;
  left: 0;
  bottom: -10px;
  width: 25px;
  height: 4px;
  background: #ffb000;
}

.app-contact {
  margin-top: auto;
  font-size: 8px;
  color: #888;
}

.app-form-group {
  margin-bottom: 15px;
}

.app-form-group.message {
  margin-top: 40px;
}

.app-form-group.buttons {
  margin-bottom: 0;
  align-items: flex-start;
}

.app-form-control {
  width: 100%;
  padding: 10px 0;
  background: none;
  border: none;
  border-bottom: 1px solid #666;
  color: #ddd;
  font-size: 14px;
  /* text-transform: uppercase; */
  outline: none;
  transition: border-color 0.2s;
}

.app-form-control::placeholder {
  color: #666;
}

.app-form-control:focus {
  border-bottom-color: #ddd;
}

.app-form-button {
  background: none;
  border: none;
  color: #ffb000;
  font-size: 14px;
  cursor: pointer;
  outline: none;
  margin: 20px 5px 5px 10px;
}

.app-form-button:hover {
  color: #ffb000;
}

@media screen and (max-width: 520px) {
  .screen-body {
    flex-direction: column;
  }

  .screen-body-item.left {
    margin-bottom: 30px;
  }

  .app-title {
    flex-direction: row;
  }

  .app-title span {
    margin-right: 12px;
  }

  .app-title:after {
    display: none;
  }
}

@media screen and (max-width: 600px) {
  .screen-body {
    padding: 40px;
  }

  .screen-body-item {
    padding: 0;
  }
}
</style>
