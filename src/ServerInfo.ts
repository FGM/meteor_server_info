import connect from "connect";
import {IncomingMessage, ServerResponse} from "http";
import "process";
// Not exposed
// import { Facts } from "meteor/facts";
// Not really usable
// import { Meteor } from "meteor/meteor";
// Not exposed
// import { MongoInternals } from "meteor/mongo";
import {WebApp} from "meteor/webapp";

import SessionInfo from "./SessionInfo";
import MongoInfo from "./MongoInfo";
import {NodeInfo, NodeInfoStore} from "./NodeInfo";
import {SocketInfo} from "./SocketInfo";

interface IFacts {
  _factsByPackage: {
    [key: string]: any,
  }
}

interface IMeteor {
  default_server: any,
  settings: {
    [key: string]: any,
  },
}

interface IInfoData {
  [key: string]: number | Counter,
}
interface IInfoSection {
  getInfo: () => IInfoData,
}

interface ServerInfoSettings {
  path: string,
  user: string,
  pass: string,
}

const defaultSettings: ServerInfoSettings = {
  path: "/serverInfo",
  user: "insecure",
  pass: "secureme",
};

type Counter = Map<number | string, number>

// Connect 2 Authentication returns a middleware
type Connect2Auth = (user: string, pass: string) => (req: IncomingMessage, res: ServerResponse, next: Function) => void;

const ServerInfo = class ServerInfo {
  public connectHandlers: connect.Server;
  public settings: ServerInfoSettings;
  public store: {
    process: NodeInfoStore,
  };

  /**
   * {constructor}
   *
   * @param {Meteor} Meteor
   *   The Meteor global.
   * @param {WebApp} WebApp
   *   The Meteor WebApp service.
   * @param {MongoInternals} MongoInternals
   *   The Meteor MongoInternals service.
   * @param {Facts} Facts
   *   The Meteor Facts collector service.
   *
   * TODO check whether Meteor.default_server might actually change over time.
   */
  constructor(
    public meteor: IMeteor,
    webApp: typeof WebApp,
    public mongoInternals: object,
    public facts: IFacts,
  ) {
    this.settings = meteor.settings.serverInfo as ServerInfoSettings || defaultSettings;
    this.connectHandlers = webApp.connectHandlers;
    // We only use the Meteor default_server key, but we keep the whole Meteor
    // object in case the default_server key might change.
    this.store = {
      process: {} as NodeInfoStore,
    };
  }

  /**
   * Collect the information from Meteor structures.
   *
   * @returns {{}}
   *   A plain object of metrics by name.
   */
  getInformation() {
    const sources = {
      "sockets":  new SocketInfo(this.meteor.default_server.stream_server.open_sockets),
      "sessions": new SessionInfo(this.meteor.default_server.sessions),
      "mongo":    new MongoInfo(this.mongoInternals),
      "process":  new NodeInfo(process, this.store.process),
    };

    const results = Object.entries(sources).reduce(this.infoReducer, {});
    console.log("reduced", results);
    results.facts = Object.assign({}, this.facts._factsByPackage);

    return results;
  }

  /**
   * Collect the descriptions provided for the metrics.
   *
   * @return {{
   * sockets: {},
   * sessions: {},
   * mongo: {}
   * }}
   *   The descriptions
   */
  static getDescriptions() {
    const descriptions = {
      "sockets":  SocketInfo.getDescription(),
      "sessions": SessionInfo.getDescription(),
      "mongo":    MongoInfo.getDescription(),
      "process":  NodeInfo.getDescription(),
    };

    return descriptions;
  }

  /**
   * Route controller serving the collected info.
   *
   * @param req
   *   A Connect request.
   * @param res
   *   A Connect response.
   */
  handle(_req: IncomingMessage, res: ServerResponse): void {
    res.setHeader("content-type", "application/json");
    return res.end(JSON.stringify(this.getInformation()));
  }

  /**
   * Route controller serving the documentation about the collected info.
   *
   * @param req
   *   A Connect request.
   * @param res
   *   A Connect response.
   */
  handleDescription(_req: IncomingMessage, res: ServerResponse) {
    res.setHeader("content-type", "application/json");
    return res.end(JSON.stringify(ServerInfo.getDescriptions()));
  }

  /**
   * Reducer for getInformation().
   *
   * @param  {{}} accu
   *   Accumulator.
   * @param {String} section
   *   The name of the information section.
   * @param  {{}} infoInstance
   *   The section information.
   *
   * @return {*}
   *   The updated accumulator.
   *
   * @private
   *
   * @see ServerInfo.getInformation()
   */
  infoReducer(accu: any, [section, infoInstance]: [string, IInfoSection]) {
    interface IValues {
      [key: string]: number,
      [key: number]: number,
    }
    const infoData = infoInstance.getInfo();
    console.log(`infoData(${section}`, infoData);
    let idk = "", idv = null;
    const infoRaw: {
      [key: string]: number|IValues
    } = {};
    for ([idk, idv] of Object.entries(infoData)) {
      console.log(`  idk ${idk}, idv`, idv);
      if (typeof idv === 'number') {
        infoRaw[idk] = idv;
      }
      else {
        // Then it is a Counter: get the values from the map
        let tmp: IValues = (infoRaw[idk] || {}) as IValues;
        const idv2: Counter = idv;
        let k: number|string = "", v: number = 0;
        for ([k, v] of idv2) {
          console.log(`    k ${k}, v`, v);
          tmp[k] = v;
        }
        infoRaw[idk] = tmp;
      }
    }

    accu[section] = infoRaw;
    return accu;
  }

  /**
   * Register a web route for the module.
   *
   * @param basicAuth
   *   Optional. Pass the connect.basicAuth middleware from Connect 2.x here to
   *   apply basic authentication to the info path using the user/pass from
   *   settings.json. If this middleware is not passed, the info route will be
   *   public, and assume it is protected by other means.
   *
   * @return {void}
   */
  register(basicAuth?: Connect2Auth) {
    const { path, user, pass } = this.settings;
    this.connectHandlers
      .use(path + "/doc", this.handleDescription.bind(this));

    if (typeof basicAuth !== 'undefined') {
      this.connectHandlers.use(path, basicAuth!(user, pass));
    }
    this.connectHandlers.use(path, this.handle.bind(this));
  }
};

export {
  Counter,
  IInfoData,
  IInfoSection,
  ServerInfo,
  NodeInfoStore,
};