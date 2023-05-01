<template>
    <b-navbar type="is-white">
        <template #brand>
            <b-navbar-item tag="router-link" :to="{ path: '/' }">
                <img src="../../public/Asset1.png">
            </b-navbar-item>
        </template>
        <template #start>
            <b-navbar-item>
                <b-tag rounded type="is-warning p-4">
                         <p class="title is-5">Doctor's Dashboard
                        </p>
                </b-tag> 
            </b-navbar-item>
            <b-navbar-item @click="$router.push('/doctor/dashboard')">
                Home
            </b-navbar-item>
            <b-navbar-item @click="$router.push('/doctor/profile')">
                Profile
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
    name: 'DocAppHeader',
    data() {
        return {
            active: '#ffb000'
        }
    },
    methods: {
        completeLogout() {
            const route = this.$router.resolve({ path: '/doctor' })
            window.open(route.href, '_self')
            this.$store.commit('doctor/logout')
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
