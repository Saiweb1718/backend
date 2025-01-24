class ApiError extends Error {
    constructor(message, status) {
        super(message);
        this.message = message;
        this.status = status;
        this.data = null;
        this.success = false

        if(stack){
            this.stack = stack
        } else {
            Error.captureStackTrace(this, ApiError);
        }
    }
} 

export  {ApiError};