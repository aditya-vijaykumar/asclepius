<template>
    <div class="home">
        <div class="hero">
            <div class="overlay"></div>
            <div class="content">
                <div class="mb-8">
                    <h1 class="title is-1 has-text-white mb-10">Doctor&apos;s Login</h1>
                </div>
                <b-button class="mt-5" type="is-info" size="is-medium" @click="ceramicAuth" :loading="buttonLoader">LOGIN</b-button>
            </div>
        </div>
    </div>
</template>

<script>
export default {
    name: "DoctorLoginScreen",
    components: {},
    data() {
        return {
            active: true,
            buttonLoader: false
        };
    },
    methods: {
        async ceramicAuth() {
            this.buttonLoader = true;
            this.$store
                .dispatch("doctor/authenticateAndFetchData")
                .then((boolFlag) => {
                    this.buttonLoader = false;
                    if (boolFlag) {
                        this.$router.push("/doctor/dashboard");
                    } else {
                        this.danger()
                    }
                })
                .catch(() => {
                    this.buttonLoader = false;
                    this.danger()
                });
        },
        danger() {
            this.$buefy.toast.open({
                duration: 5000,
                message: `Unsuccesful Login attempt, the connected wallet does not have a medical license.`,
                position: "is-bottom",
                type: "is-danger",
            });
        },
    },
    computed: {
        // getAuth() {
        //     return this.$store.getters.authstatus;
        // },
    },
};
</script>
<style scoped>
.center {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 100%;
}

.hero {
    height: 1080px;
    width: 100%;
    background-image: url("../../../public/ArtboardStandard.jpg");
    background-size: cover;
    background-repeat: no-repeat;
    background-position: center;
    position: relative;
    overflow: hidden;
    display: flex;
    align-items: center;
    justify-content: center;
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
    opacity: 0.3;
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
