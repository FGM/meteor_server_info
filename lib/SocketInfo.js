"use strict";
var __values = (this && this.__values) || function(o) {
    var s = typeof Symbol === "function" && Symbol.iterator, m = s && o[s], i = 0;
    if (m) return m.call(o);
    if (o && typeof o.length === "number") return {
        next: function () {
            if (o && i >= o.length) o = void 0;
            return { value: o && o[i++], done: !o };
        }
    };
    throw new TypeError(s ? "Object is not iterable." : "Symbol.iterator is not defined.");
};
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * Provides the socket-level information.
 */
var SocketInfo = /** @class */ (function () {
    /**
     * Constructor.
     *
     * @param {Array} sockets
     *   The sockets opened on the active stream server.
     *
     * @constructor
     */
    function SocketInfo(sockets) {
        this.sockets = sockets;
        this.info = this.defaultInfo();
    }
    /**
     * Describe the metrics provided by this service.
     *
     * @return {{
     *   nSockets: {type: string, label: string},
     *   nSocketsWithLivedataSessions: {type: string, label: string}
     * }}
     *  The description.
     */
    SocketInfo.prototype.getDescription = function () {
        var description = {
            nSockets: { type: "integer", label: "Open sockets" },
            nSocketsWithLivedataSessions: { type: "integer", label: "Sockets with session" },
        };
        return description;
    };
    /**
     * Check out the connections and what we know about them.
     *
     * @return
     *   - nSockets: the global socket count
     *   - nSocketsWithLivedataSessions: the number of sockets with live data.
     */
    SocketInfo.prototype.getInfo = function () {
        var e_1, _a;
        this.info = this.defaultInfo();
        try {
            for (var _b = __values(this.sockets), _c = _b.next(); !_c.done; _c = _b.next()) {
                var socket = _c.value;
                this.info.nSockets += 1;
                // Name apparently changed across Meteor versions.
                if (socket._meteorSession || socket.meteor_session) {
                    this.info.nSocketsWithLivedataSessions += 1;
                }
            }
        }
        catch (e_1_1) { e_1 = { error: e_1_1 }; }
        finally {
            try {
                if (_c && !_c.done && (_a = _b.return)) _a.call(_b);
            }
            finally { if (e_1) throw e_1.error; }
        }
        return this.info;
    };
    SocketInfo.prototype.defaultInfo = function () {
        return {
            nSockets: 0,
            nSocketsWithLivedataSessions: 0,
        };
    };
    return SocketInfo;
}());
exports.SocketInfo = SocketInfo;
//# sourceMappingURL=SocketInfo.js.map