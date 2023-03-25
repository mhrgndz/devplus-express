import db from '../services/Db.js'

class Authentication {
    async verifyToken(req) {
        const token = req.headers['accesstoken'];
        const tokenResult = await db.query("select id from users where is_enabled = true and access_token=$1", [token]);

        if(tokenResult.rowCount) {
            return true;
        }
        
        return false;
    }
}

export default Authentication;