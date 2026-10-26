import { credentialResponse, methodNotAllowed } from "../../../worker/credential.js";

export function onRequest({ request, env }) {
    if (request.method !== "GET") return methodNotAllowed();
    return credentialResponse(env);
}
