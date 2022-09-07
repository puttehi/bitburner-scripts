//import { NS as OriginalNS } from "../bitburner/src/ScriptEditor/NetscriptDefinitions";
//import { NS } from "./bitburner/src/ScriptEditor/NetscriptDefinitions";
//export * from "./bitburner/src/ScriptEditor/NetscriptDefinitions";
//export interface NS {}

//import { NS as OriginalNS } from "../bitburner/src/ScriptEditor/NetscriptDefinitions";
import {NS as _NS} from "bitburner/src/ScriptEditor/NetscriptDefinitions"
declare global { 
    export {_NS as NS}
}

//export {OriginalNS as NS}

// interface Heart {
//   /**
//    * Get Player's current Karma
//    * @remarks
//    * RAM cost: 0 GB
//    *
//    * @returns current karma.
//    */
//   break(): number;
// }
// export interface NS extends OriginalNS {
//   readonly heart: Heart;
// }