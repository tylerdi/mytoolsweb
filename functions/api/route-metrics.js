import {routeMetrics} from '../../assets/route-metrics-server.mjs';
export function onRequest({request,env}){return routeMetrics(request,env);}
