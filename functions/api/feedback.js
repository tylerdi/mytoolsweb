import {handleFeedback} from '../../feedback/handler.mjs';
export function onRequest({request,env}) { return handleFeedback(request,env); }
