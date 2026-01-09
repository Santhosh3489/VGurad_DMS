import { WebPartContext } from "@microsoft/sp-webpart-base";

// import pnp and pnp logging system
import { spfi, SPFI, SPFx } from "@pnp/sp";
import { LogLevel, PnPLogging } from "@pnp/logging";
import { graphfi, GraphFI, SPFx as GraphSPFx } from "@pnp/graph";
import "@pnp/sp/webs";
import "@pnp/sp/lists";
import "@pnp/sp/items";
import "@pnp/sp/fields";
import "@pnp/sp/files";
import "@pnp/sp/folders";
import "@pnp/sp/sites";
import "@pnp/sp/site-users/web";
import "@pnp/sp/attachments";
import "@pnp/sp/profiles";
import "@pnp/common";
import "@pnp/sp/site-users";
import "@pnp/sp";
import "@pnp/graph/users";
import "@pnp/graph/groups";
import "@pnp/graph/teams";
import "@pnp/sp/search";
// eslint-disable-next-line no-var
let _sp: SPFI = null;
let _graph: GraphFI = null;

export const getSP = (context?: WebPartContext): SPFI => {
  if (!!context) { // eslint-disable-line eqeqeq
    //You must add the @pnp/logging package to include the PnPLogging behavior it is no longer a peer dependency
    // The LogLevel set's at what level a message will be written to the console
    _sp = spfi().using(SPFx(context)).using(PnPLogging(LogLevel.Warning));
  }
  return _sp;
};

export const getGraph = (context?: WebPartContext): GraphFI => {
  if(!!context){
    // You must add the @pnp/logging package to include the PnPLogging behavior it is no longer a peer dependency
    // The LogLevel sets at what level a message will be written to the console
    _graph = graphfi().using(GraphSPFx(context)).using(PnPLogging(LogLevel.Warning));
  }
  return _graph;
}