// An error that carries the HTTP status code to send back to the client
export class HttpError extends Error {
    constructor(
        public readonly status: number,
        message: string
    ) {
        super(message);
        this.name = "HttpError";
    }
}
