import pg from 'pg';
import * as dotenv from 'dotenv';

dotenv.config();

const db = new pg.Pool({
    connectionString: process.env.DB_CONNECTION_STRING
});

await db.connect(err => {
    if (err) {
        console.log(err);
    }else {
        console.log("Db Connected");
    }
});

export default db;