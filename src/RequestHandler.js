import ResponseObject from "./objects/ResponseObject.js";
import ResponseCodes from "./objects/ResponseCodes.js";

import UserHandler from "./handler/UserHandler.js";
import VehicleHandler from "./handler/VehicleHandler.js";
import LoginHandler from "./handler/LoginHandler.js";

class RequestHandler {

    constructor(event) {
        this.event = event;
        this.userInstance = new UserHandler();
        this.vehicleInstance = new VehicleHandler();
        this.loginInstance = new LoginHandler();
        this.funcMap = {
            "login": this.loginInstance,
            "user": this.userInstance,
            "vehicle": this.vehicleInstance,
        };

        this.findPath(event);
    }
    
    async findPath() {
        this.pathObject = this.event.path.split("/").filter(item => {return item !== ""});
        this.handler = this.pathObject[1];
        this.func = this.pathObject[2];
    }

    async dispatch() {
        let result;

        try {
            result = await this.funcMap[this.handler][this.func](this.event.body);
        } catch (error) {
            console.log(error);
            result = new ResponseObject({}, ResponseCodes.SERVER_ERROR, error);
        } finally {
            console.log(JSON.stringify(result));
        }
        return result;
    }
}

export default RequestHandler