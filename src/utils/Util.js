import { v4 as uuidv4 } from "uuid";
import fs from "fs";

class Util {

    async randomUuid() {
        return uuidv4();
    }

    async readFile(path) {

        try {
            return await fs.promises.readFile(path);
        } catch (err) {
            console.error(err);
        }
    }
}

export default Util;