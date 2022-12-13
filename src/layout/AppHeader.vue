<template>
    <b-navbar type="is-white">
        <template #brand>
            <b-navbar-item tag="router-link" :to="{ path: '/' }">
                <img src="../../public/Asset1.png">
            </b-navbar-item>
        </template>
        <template #start>
            <b-navbar-item @click="$router.push('/dashboard')">
                Home
            </b-navbar-item>
            <b-navbar-item @click="$router.push('/profile')">
                Profile
            </b-navbar-item>
            <b-navbar-item tag="div">
                <div class="buttons">
                    <a class="button is-warning" @click="$router.push('/new-record')">
                        <strong>New Record</strong>
                    </a>
                </div>
            </b-navbar-item>
        </template>

        <template #end>
            <b-navbar-item tag="div">
                <div class="buttons">
                    <b-button type="is-danger" @click="completeLogout">Logout</b-button>
                </div>
            </b-navbar-item>
        </template>
    </b-navbar>
</template>

<script>
export default {
    name: 'AppHeader',
    data() {
        return {
            active: '#ffb000'
        }
    },
    methods: {
        openLoading() {
            const loading = this.$vs.loading()
            setTimeout(() => {
                loading.close()
            }, 2500)
        },
        newRecord() {
            this.$router.push('/new')
        },
        async logout() {
            const loading = this.$vs.loading()
            await this.$store.dispatch('logoutTriggered')
            const route = this.$router.resolve({ path: '/' })
            setTimeout(() => {
                loading.close()
                window.open(route.href, '_self')
            }, 2500)
        },
        completeLogout() {
            const route = this.$router.resolve({ path: '/' })
            window.open(route.href, '_self')
            this.$store.commit('logout')
        }
    }
}
</script>

<style>
div.examplex {
    position: absolute;
    top: 0%;
    left: 0%;
}
</style>
