import axios from "axios";

const api = axios.create({
    baseURL: "https://indo-swalayan.vercel.app"
})

export default api;
