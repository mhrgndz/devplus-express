import cryptoJS from "crypto-js";

class CryptoUtil {
    
    async encrypt(data, secret) {
        return cryptoJS.AES.encrypt(JSON.stringify(data), secret).toString();
    }

    async decrypt(data, secret) {
        const bytes = cryptoJS.AES.decrypt(data, secret);
        const result = JSON.parse(bytes.toString(cryptoJS.enc.Utf8));
        return result;
    }
}

export default CryptoUtil;