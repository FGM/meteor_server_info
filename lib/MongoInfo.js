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
 * Provides the MongoDB-related information: observers and observed collections.
 */
var MongoInfo = /** @class */ (function () {
    /**
     * Constructor.
     *
     * @param {Object} mongoInternals
     *   The Meteor MongoInternals service.
     *
     * @constructor
     */
    function MongoInfo(mongoInternals) {
        this.info = this.defaultInfo();
        this.muxes = mongoInternals.defaultRemoteCollectionDriver().mongo._observeMultiplexers;
    }
    /**
     * Describe the metrics provided by this service.
     *
     * @return {{
     *   nObserveHandles: {type: string, label: string},
     *   oplogObserveHandles: {type: string, label: string},
     *   oplogObserveHandlesCount: {type: string, label: string},
     *   pollingObserveHandles: {type: string, label: string},
     *   pollingObserveHandlesCount: {type: string, label: string}
     * }}
     *   The description.
     */
    MongoInfo.prototype.getDescription = function () {
        var description = {
            nObserveHandles: { type: "integer", label: "Overall observers count" },
            oplogObserveHandles: { type: "array", label: "Oplog-based observers[]" },
            oplogObserveHandlesCount: { type: "integer", label: "Oplog-based observers" },
            pollingObserveHandles: { type: "array", label: "Polling-based observers[]" },
            pollingObserveHandlesCount: { type: "integer", label: "Polling-based observers" },
        };
        return description;
    };
    /**
     * Get MongoDB-level information.
     *
     * @return {*}
     *   - nObserveHandles: the total count of observe handles
     *   - oplogObserveHandles hash: count of oplog observers by collection
     *   - oplogObserveHandlesCount: the total count of oplog observers
     *   - pollingObserveHandles hash: count of polling observers by collection
     *   - pollingObserveHandlesCount: the total count of polling observers.
     */
    MongoInfo.prototype.getInfo = function () {
        var e_1, _a, e_2, _b;
        this.info = this.defaultInfo();
        try {
            for (var _c = __values(Object.values(this.muxes)), _d = _c.next(); !_d.done; _d = _c.next()) {
                var mux = _d.value;
                var mux2 = mux;
                try {
                    for (var _e = (e_2 = void 0, __values(Object.values(mux2._handles))), _f = _e.next(); !_f.done; _f = _e.next()) {
                        var handle = _f.value;
                        this.buildHandleInfo(handle);
                    }
                }
                catch (e_2_1) { e_2 = { error: e_2_1 }; }
                finally {
                    try {
                        if (_f && !_f.done && (_b = _e.return)) _b.call(_e);
                    }
                    finally { if (e_2) throw e_2.error; }
                }
            }
        }
        catch (e_1_1) { e_1 = { error: e_1_1 }; }
        finally {
            try {
                if (_d && !_d.done && (_a = _c.return)) _a.call(_c);
            }
            finally { if (e_1) throw e_1.error; }
        }
        return this.info;
    };
    /**
     * Build information about observed collections into this.info.
     *
     * @param {String} type
     *   The observer type.
     * @param {String} collectionName
     *   The observed collection name.
     *
     * @return {void}
     *
     * @private
     */
    MongoInfo.prototype.buildCollectionInfo = function (type, collectionName) {
        switch (type) {
            case "pollingObserveHandles":
                this.info.pollingObserveHandlesCount++;
                break;
            case "oplogObserveHandles":
                this.info.oplogObserveHandlesCount++;
                break;
        }
        if (!this.info[type].has(collectionName)) {
            this.info[type].set(collectionName, 0);
        }
        // TODO: inline after Node >= 10.7 when NanoTs is removed.
        var val = this.info[type].get(collectionName);
        this.info[type].set(collectionName, 
        // Counter was defined in constructor, collection in previous line.
        val + 1);
    };
    /**
     * Build information about observed collections into this.info.
     *
     * @param {Object} handle
     *   The private structure held by Meteor for an observer.
     *
     * @return {void}
     *
     * @private
     */
    MongoInfo.prototype.buildHandleInfo = function (handle) {
        this.info.nObserveHandles += 1;
        // TODO check whether handle._observeDriver can actually occur.
        var driver = handle._observeDriver || handle._multiplexer._observeDriver;
        var collectionName = driver._cursorDescription.collectionName;
        var observerType = driver._usesOplog ? "oplogObserveHandles" : "pollingObserveHandles";
        this.buildCollectionInfo(observerType, collectionName);
    };
    MongoInfo.prototype.defaultInfo = function () {
        return {
            nObserveHandles: 0,
            oplogObserveHandles: new Map(),
            oplogObserveHandlesCount: 0,
            pollingObserveHandles: new Map(),
            pollingObserveHandlesCount: 0,
        };
    };
    return MongoInfo;
}());
exports.MongoInfo = MongoInfo;
//# sourceMappingURL=MongoInfo.js.map