"use strict";
var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
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
var process_1 = require("process");
var types_1 = require("../types");
var CounterBase_1 = require("./CounterBase");
/**
 * This counter attempts to mimic NewRelic's "CPU time per tick" metric.
 *
 * It is expensive because:
 *
 * - it prevents the CPU optimization in the poll phase from running because it
 *   sees the "immediate" job queues and does not linger in the poll phase.
 * - its code is cheap but runs on each tick.
 *
 * On an "Intel(R) Core(TM) i7-3770 CPU @ 3.40GHz", it causes about 6% CPU load.
 *
 * @deprecated As of Meteor 1.2.5, this class is deprecated: ElsCounter provides
 *   similar results with far less server load. It will be removed in 1.3 at the
 *   latest.
 */
var NrCounter = /** @class */ (function (_super) {
    __extends(NrCounter, _super);
    /**
     * @param log
     *   A "console.log(sprintf(" compatible function.
     */
    function NrCounter(log) {
        if (log === void 0) { log = types_1.nullLogger; }
        var _this = _super.call(this, log) || this;
        _this.log = log;
        _this.cpuPerTickMax = 0;
        /**
         * Maintained separately from regular polls to be reset on read.
         */
        _this.loopLagMaxMsecSinceLastFetch = 0;
        _this.immediateTimer = undefined;
        _this.latestTickTimerUsage = _this.latestPollUsage = process_1.cpuUsage();
        _this.latestTickTimerNanoTS = types_1.NanoTs.forNow();
        _this.tickCount = 0;
        return _this;
    }
    /**
     * Resetting max(cpuMsec) and return its value.
     *
     * This method is only public for tests: it is not meant for external use.
     *
     * @return
     *   - max(cpuMsecPerTick)
     *   - max(abs(clockMsecLag))
     *   Both since last call to counterReset().
     */
    NrCounter.prototype.counterReset = function () {
        var max = {
            cpuPerTickMax: this.cpuPerTickMax,
            loopLagMaxMsecSinceLastFetch: this.loopLagMaxMsecSinceLastFetch,
        };
        this.loopLagMaxMsecSinceLastFetch = 0;
        this.cpuPerTickMax = 0;
        return max;
    };
    /**
     * @inheritDoc
     */
    NrCounter.prototype.getDescription = function () {
        var numberTypeName = "number";
        return {
            cpuPerSecond: {
                label: "CPU milliseconds used by process during last quasi-second.",
                type: numberTypeName,
            },
            cpuPerTickAvg: {
                label: "Average CPU milliseconds used by process per tick during last quasi-second.",
                type: numberTypeName,
            },
            cpuPerTickMax: {
                label: "Maximum of CPU milliseconds used by process since last fetch, not last quasi-second.",
                type: numberTypeName,
            },
            loopLagMaxMsecSinceLastFetch: {
                label: "Maximum loop duration deviation from 1 msec (in msec) since last fetch, not last quasi-second.",
                type: numberTypeName,
            },
            tickCount: {
                label: "Exact tick count during last quasi-second.",
                type: numberTypeName,
            },
            tickLagAvg: {
                label: "Average tick duration deviation from 1 msec (in msec) during last quasi-second.",
                type: numberTypeName,
            },
            ticksPerSec: {
                label: "Average ticks per second during last quasi-second",
                type: numberTypeName,
            },
        };
    };
    /**
     * @inheritDoc
     */
    NrCounter.prototype.getLastPoll = function () {
        var e_1, _a;
        var poll = __assign(__assign({}, this.lastPoll), this.counterReset());
        var keys = Object.keys(poll).sort();
        var res = {};
        try {
            for (var keys_1 = __values(keys), keys_1_1 = keys_1.next(); !keys_1_1.done; keys_1_1 = keys_1.next()) {
                var key = keys_1_1.value;
                res[key] = poll[key];
            }
        }
        catch (e_1_1) { e_1 = { error: e_1_1 }; }
        finally {
            try {
                if (keys_1_1 && !keys_1_1.done && (_a = keys_1.return)) _a.call(keys_1);
            }
            finally { if (e_1) throw e_1.error; }
        }
        return res;
    };
    /**
     * @inheritDoc
     *
     * This method is only public for tests: it is not meant for external use.
     */
    NrCounter.prototype.poll = function () {
        var _a = __read(_super.prototype.poll.call(this), 2), prev = _a[0], nsec = _a[1];
        var usage = process_1.cpuUsage();
        var _b = process_1.cpuUsage(this.latestPollUsage), user = _b.user, system = _b.system;
        var cpuMsecPerSecond = (user + system) / 1E3; // µsec to msec.
        // The actual number of loops performed since the previous poll() call.
        // Math.max is used in case this code runs before the loop counter when LAP <= 1 msec.
        var tickCount = Math.max(this.tickCount, 1);
        // The time elapsed since the previous poll() call.
        // TODO replace by nsec - nprev after Node >= 10.7
        var clockMsec = nsec.sub(prev).toMsec();
        var clockMsecPerTick = clockMsec / tickCount;
        var tickLagAvg = clockMsecPerTick - 1;
        var ticksPerSec = tickCount / clockMsec * CounterBase_1.CounterBase.LAP;
        var cpuMsecPerTickAvg = cpuMsecPerSecond / tickCount;
        this.log("%4d ticks in %4d msec => Ticks/sec: %5d, CPU usage %5d msec => CPU/tick %6.3f msec", tickCount, clockMsec, ticksPerSec, cpuMsecPerSecond, cpuMsecPerTickAvg);
        this.tickCount = 0;
        this.latestPollUsage = usage;
        this.setLastPoll({
            cpuPerSecond: cpuMsecPerSecond,
            cpuPerTickAvg: cpuMsecPerTickAvg,
            tickCount: tickCount,
            tickLagAvg: tickLagAvg,
            ticksPerSec: ticksPerSec,
        });
        return [prev, nsec];
    };
    /**
     * Start the metric collection.
     *
     * @return
     *   A timer instance usable with this.stop() to stop collection.
     */
    NrCounter.prototype.start = function () {
        _super.prototype.start.call(this);
        // Initialize selector counters (max/min).
        this.counterReset();
        // Start the actual counting loop.
        return this.tickImmediate();
    };
    /**
     * @inheritDoc
     */
    NrCounter.prototype.stop = function () {
        if (typeof this.immediateTimer !== "undefined") {
            clearImmediate(this.immediateTimer);
            this.immediateTimer = undefined;
        }
        if (typeof this.nrTimer !== "undefined") {
            clearTimeout(this.nrTimer);
            this.nrTimer = undefined;
        }
        _super.prototype.stop.call(this);
    };
    /**
     * Force the event loop not to idle-wait and go back to the timer step.
     *
     * This is the main reason why this technique is costly, but accurate, as it
     * prevents NodeJS from doing the cost-reducing optimization in the "poll"
     * phase of the event loop.
     *
     * Notice: setTimeout(cb, 0) actually means setTimeout(cb, 1).
     *
     * @see https://nodejs.org/api/timers.html#timers_settimeout_callback_delay_args
     *
     * "When delay is [...] less than 1, the delay will be set to 1."
     */
    NrCounter.prototype.tickImmediate = function () {
        return this.nrTimer = setTimeout(this.tickTimer.bind(this), 0);
    };
    /**
     * Update the maximum loop lag and CPU usage during the last tick.
     *
     * @see poll
     */
    NrCounter.prototype.tickTimer = function () {
        // Evaluate maximum clockMsecLag
        // TODO replace this Node 8 version by the one below after Node >= 10.7.
        var clockPrev = this.latestTickTimerNanoTS;
        // Ticks are expected to happen every 1/CounterBase seconds = 1 msec.
        var tickLag = types_1.NanoTs.forNow().sub(clockPrev).toMsec() - 1;
        if (Math.abs(tickLag) > Math.abs(this.loopLagMaxMsecSinceLastFetch)) {
            this.loopLagMaxMsecSinceLastFetch = tickLag;
        }
        this.latestTickTimerNanoTS = types_1.NanoTs.forNow();
        // Evaluate maximum cpuPerTickMax.
        var usage = process_1.cpuUsage();
        var _a = process_1.cpuUsage(this.latestTickTimerUsage), user = _a.user, system = _a.system;
        var cpuMsecPerTick = (user + system) / 1E3; // µsec to msec.
        if (cpuMsecPerTick > this.cpuPerTickMax) {
            this.cpuPerTickMax = cpuMsecPerTick;
        }
        this.latestTickTimerUsage = usage;
        // Update per-tick counter.
        this.tickCount++;
        // Rearm.
        this.immediateTimer = setImmediate(this.tickImmediate.bind(this));
    };
    return NrCounter;
}(CounterBase_1.CounterBase));
exports.NrCounter = NrCounter;
//# sourceMappingURL=NrCounter.js.map