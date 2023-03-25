import ResponseObject from "../objects/ResponseObject.js";
import ResponseCodes from "../objects/ResponseCodes.js";
import ErrorMessage from '../objects/ErrorMessage.js';
import CryptoUtil from "../utils/CryptoUtil.js";
import db from "../services/Db.js";

class UserHandler {

    constructor() {
        this.crypto = new CryptoUtil();
    }

    async signin(body) {

        if (!body.name || !body.surname || !body.mobilePhone || !body.password) {
            return new ResponseObject({}, ResponseCodes.ERROR, ErrorMessage.MISSING_PARAMETERS);
        }

        const user = await this.selectUser(body.mobilePhone);

        if (user.rowCount) {
            return new ResponseObject({}, ResponseCodes.ERROR, ErrorMessage.PHONE_NUMBER_EXISTS);
        }

        const encrytedPassword = await this.crypto.encrypt(body.password, process.env.USER_PASSWORD_KEY);

        await this.insertUser(body, encrytedPassword);

        return new ResponseObject({}, ResponseCodes.OK);
    }

    async get(body) {

        if (!body.userId) {
            return new ResponseObject({}, ResponseCodes.ERROR, ErrorMessage.MISSING_PARAMETERS);
        }

        const result = await this.selectUser(null, body.userId);

        return new ResponseObject(result.rows, ResponseCodes.OK);
    }

    async update(body) {

        if (!body.userId || !body.name || !body.surname || !body.email || !body.mobilePhone || !body.isEnabled || !body.password) {
            return new ResponseObject({}, ResponseCodes.ERROR, ErrorMessage.MISSING_PARAMETERS);
        }

        const user = await this.selectUser(body.mobilePhone);

        if (user.rowCount) {
            return new ResponseObject({}, ResponseCodes.ERROR, ErrorMessage.PHONE_NUMBER_EXISTS);
        }
        
        const encrytedPassword = await this.crypto.encrypt(body.password, process.env.USER_PASSWORD_KEY);

        const result = await this.updateUser(body, encrytedPassword);

        return new ResponseObject(result.rows, ResponseCodes.OK);
    }

    // #region Private methods

    async insertUser(data, encrytedPassword) {

        const signinInsert = `insert into public.users(name, surname, email, mobile_phone, password)
            VALUES ($1, $2, $3, $4, $5)`;
        await db.query(signinInsert, [data.name, data.surname, data.email, data.mobilePhone, encrytedPassword]);
    }

    async selectUser(mobilePhone, userId) {

        const user = await db.query('select * from users where (mobile_phone = $1) or ((id = $2) or ($2 = -1))', [mobilePhone || null, userId || null]);

        return user;
    }

    async updateUser(data, encrytedPassword) {
         
        const query = "update users set name=$2, surname=$3, email=$4, mobile_phone=$5, is_enabled=$6, password=$7 where id =$1";

        return await db.query(query, [data.userId, data.name, data.surname, data.email, data.mobilePhone, data.isEnabled, encrytedPassword]);
    }

    // #endregion Private methods
}

export default UserHandler;