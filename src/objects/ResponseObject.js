class ResponseObject {
    constructor(data, statusCode, message) {
        if(!message) {
            this.message = "SUCCESS";
            this.statusCode = 200;
        }
        else {
            this.message = message;
            this.statusCode = statusCode;
        }
        this.body = JSON.stringify(data);
    }
}

export default ResponseObject