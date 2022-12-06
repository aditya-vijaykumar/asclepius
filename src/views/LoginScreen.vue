<template>
    <div class="home">
        <div class="hero">
            <div class="overlay"></div>
            <div class="content">
                <b-button type="is-info" size="is-medium" @click="ceramicAuth" :loading="buttonLoader">LOGIN</b-button>
            </div>
        </div>
    </div>
</template>

<script>
export default {
    name: "LoginScreen",
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
                .dispatch("encryptAndStore")
                .then((boolFlag) => {
                    this.buttonLoader = false;
                    if (boolFlag) {
                        this.$router.push("/dashboard");
                    } else {
                        this.danger()
                    }
                })
                .catch(() => {
                    this.buttonLoader = false;
                    this.danger()
                });
            // .then((boolean) => {
            //     if (boolean) {
            //         let route = this.$router.resolve({ path: "/home" });
            //         setTimeout(() => {
            //             window.open(route.href, "_self");
            //         }, 5000);
            //     }
            // })
            // .catch((err) => console.error(err));
        },
        danger() {
            this.$buefy.toast.open({
                duration: 5000,
                message: `Unsuccesful Login attempt, please try again later.`,
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
    background-image: url("../../public/ArtboardStandard.jpg");
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
