import axios from "axios";
import axiosRetry from "axios-retry";

const axiosInstance = axios.create({
    timeout: 10000,
});

axiosRetry(axiosInstance, {
    retries: 5,
    retryDelay: (retryCount) => retryCount * 1000,
    retryCondition: (error) => axiosRetry.isNetworkError(error) || axiosRetry.isRetryableError(error),
});

export default axiosInstance;