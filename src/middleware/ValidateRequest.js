import PathObject from '../objects/PathObject.js';
import Authentication from './Authentication.js';
import ResponseObject from '../objects/ResponseObject.js';
import ErrorMessage from '../objects/ErrorMessage.js';
import ResponseCodes from '../objects/ResponseCodes.js';

class ValidateRequest {
    constructor() {
        this.PathObject = PathObject;
    }
    async validateRequest(req) {
        const verifyPathResult = await this.verifyPathObject(req.path);

        if (verifyPathResult) {
            return new ResponseObject({}, ResponseCodes.OK);
        }

        const Aut = new Authentication();
        const verifyTokenResult = await Aut.verifyToken(req);

        if (!verifyTokenResult) {
            return new ResponseObject({}, ResponseCodes.ERROR, ErrorMessage.INVALID_TOKEN);
        }

        return new ResponseObject({}, ResponseCodes.OK);
    }
    async verifyPathObject(requestPath) {
        const findPath = requestPath.split("/").filter(item => {return item !== ""});
        const pathResult = this.PathObject.find(path => path === findPath[2]);

        return pathResult;
    }
}

export default ValidateRequest;