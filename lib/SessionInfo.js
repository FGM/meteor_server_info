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
var __read = (this && this.__read) || function (o, n) {
    var m = typeof Symbol === "function" && o[Symbol.iterator];
    if (!m) return o;
    var i = m.call(o), r, ar = [], e;
    try {
        while ((n === void 0 || n-- > 0) && !(r = i.next()).done) ar.push(r.value);
    }
    catch (error) { e = { error: error }; }
    finally {
        try {
            if (r && !r.done && (m = i["return"])) m.call(i);
        }
        finally { if (e) throw e.error; }
    }
    return ar;
};
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * Provides the session-related information: sessions, subscriptions, documents.
 */
var SessionInfo = /** @class */ (function () {
    /**
     * @param sessions
     *   The private structure held by Meteor for its sessions list.
     *
     * @constructor
     */
    function SessionInfo(sessions) {
        this.sessions = sessions;
        this.info = this.defaultInfo();
    }
    /**
     * Describe the metrics provided by this service.
     */
    SessionInfo.prototype.getDescription = function () {
        var description = {
            nDocuments: {
                label: "Total number of documents across subscriptions. Each appearance in a subscription counts.",
                type: "Map",
            },
            nSessions: {
                label: "Number of sessions",
                type: "number",
            },
            nSubs: {
                label: "Total number of Subscriptions  across sessions",
                type: "Map",
            },
            usersWithNSubscriptions: {
                label: "User counts per subscription count",
                type: "Map",
            },
        };
        return description;
    };
    /**
     * Get session information.
     *
     * @return
     *   - nSessions: the overall number of sessions
     *   - usersWithNSubscriptions: a Counter of the users count per number of subs.
     *   - nSubs: a Counter of subscriptions count per subscription name
     *   - nDocuments: a Counter of document counts per subscription
     */
    SessionInfo.prototype.getInfo = function () {
        var e_1, _a;
        var _this = this;
        this.info = this.defaultInfo();
        // New format required starting with Meteor 1.8.1.
        if (this.sessions instanceof Map) {
            this.info.nSessions = this.sessions.size;
            this.sessions.forEach(function (s, id) {
                // Convert typed NamedSubs to legacy base objects.
                var session = {
                    _namedSubs: (function (subs) {
                        var e_2, _a;
                        var r = {};
                        try {
                            for (var subs_1 = __values(subs), subs_1_1 = subs_1.next(); !subs_1_1.done; subs_1_1 = subs_1.next()) {
                                var _b = __read(subs_1_1.value, 2), k = _b[0], v = _b[1];
                                r[k] = v;
                            }
                        }
                        catch (e_2_1) { e_2 = { error: e_2_1 }; }
                        finally {
                            try {
                                if (subs_1_1 && !subs_1_1.done && (_a = subs_1.return)) _a.call(subs_1);
                            }
                            finally { if (e_2) throw e_2.error; }
                        }
                        return r;
                    })(s._namedSubs),
                    id: id,
                };
                _this.addPerSessionInfo(Object.values(session._namedSubs));
            });
        }
        else {
            this.info.nSessions = Object.keys(this.sessions).length;
            try {
                for (var _b = __values(Object.values(this.sessions)), _c = _b.next(); !_c.done; _c = _b.next()) {
                    var session = _c.value;
                    session = {
                        _namedSubs: session._namedSubs,
                        id: session.id,
                    };
                    this.addPerSessionInfo(Object.values(session._namedSubs));
                }
            }
            catch (e_1_1) { e_1 = { error: e_1_1 }; }
            finally {
                try {
                    if (_c && !_c.done && (_a = _b.return)) _a.call(_b);
                }
                finally { if (e_1) throw e_1.error; }
            }
        }
        return this.info;
    };
    /**
     * Add the session information to this.info.
     *
     * @param subscriptions
     *   The private structure held by Meteor for the subscriptions of a session.
     */
    SessionInfo.prototype.addPerSessionInfo = function (subscriptions) {
        var subCount = subscriptions.length;
        this.incrementCounter(this.info.usersWithNSubscriptions, subCount);
        this.addPerSessionSubscriptionInfo(subscriptions);
    };
    /**
     * Build the subscription information for a session into this.info.
     *
     * @param subscriptions
     *   The private structure held by Meteor for a subscription within a session.
     */
    SessionInfo.prototype.addPerSessionSubscriptionInfo = function (subscriptions) {
        var e_3, _a;
        try {
            for (var subscriptions_1 = __values(subscriptions), subscriptions_1_1 = subscriptions_1.next(); !subscriptions_1_1.done; subscriptions_1_1 = subscriptions_1.next()) {
                var subscription = subscriptions_1_1.value;
                subscription = {
                    _documents: subscription._documents,
                    _name: subscription._name,
                };
                this.incrementCounter(this.info.nSubs, subscription._name);
                this._buildDocumentCountsPerSubscription(subscription._documents);
            }
        }
        catch (e_3_1) { e_3 = { error: e_3_1 }; }
        finally {
            try {
                if (subscriptions_1_1 && !subscriptions_1_1.done && (_a = subscriptions_1.return)) _a.call(subscriptions_1);
            }
            finally { if (e_3) throw e_3.error; }
        }
    };
    /**
     * Provide info initialization data, to allow recalculating it on an instance.
     */
    SessionInfo.prototype.defaultInfo = function () {
        return {
            nDocuments: new Map(),
            nSessions: 0,
            nSubs: new Map(),
            usersWithNSubscriptions: new Map(),
        };
    };
    /**
     * Increment counter value for a key, initializing if needed.
     *
     * @param counter
     * @param key
     * @param increment
     */
    SessionInfo.prototype.incrementCounter = function (counter, key, increment) {
        if (increment === void 0) { increment = 1; }
        this.initKey(counter, key);
        // get() is guaranteed to be defined because we just did initKey().
        // TODO: inline after Node >= 10.7 when NanoTs is removed.
        var val = counter.get(key);
        counter.set(key, val + increment);
    };
    /**
     * Ensure initialization of a counter. Do not modify it if alreay set.
     *
     * @param part
     *   The container for the counter.
     * @param key
     *   The counter name.
     */
    SessionInfo.prototype.initKey = function (part, key) {
        if (!part.has(key)) {
            part.set(key, 0);
        }
    };
    /**
     * Build the document information for a subscription into this.info.
     *
     * @param documents
     *   The private structure held by Meteor for the documents of a subscription.
     */
    SessionInfo.prototype._buildDocumentCountsPerSubscription = function (documents) {
        var e_4, _a;
        var entries = Object.entries(documents);
        try {
            for (var entries_1 = __values(entries), entries_1_1 = entries_1.next(); !entries_1_1.done; entries_1_1 = entries_1.next()) {
                var entry = entries_1_1.value;
                // Inlining the destructuring in for() loses type information, so do it here.
                var _b = __read(entry, 2), type = _b[0], document_1 = _b[1];
                this.incrementCounter(this.info.nDocuments, type, Object.keys(document_1).length);
            }
        }
        catch (e_4_1) { e_4 = { error: e_4_1 }; }
        finally {
            try {
                if (entries_1_1 && !entries_1_1.done && (_a = entries_1.return)) _a.call(entries_1);
            }
            finally { if (e_4) throw e_4.error; }
        }
    };
    return SessionInfo;
}());
exports.SessionInfo = SessionInfo;
//# sourceMappingURL=SessionInfo.js.map