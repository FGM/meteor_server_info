"use strict";
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
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * Provides the Node.JS-related information: RAM, CPU load.
 */
var NodeInfo = /** @class */ (function () {
    /**
     * @param process
     *   The NodeJS process module or a stub for it.
     * @constructor
     *   The event loop observer to use, if not empty.
     *
     * @constructor
     */
    function NodeInfo(process, counter) {
        this.process = process;
        this.counter = counter;
        this.latestCpu = { user: 0, system: 0 };
        this.latestPoll = 0;
        this.info = {
            cpuSystem: 0,
            cpuUser: 0,
            ramExternal: 0,
            ramHeapTotal: 0,
            ramHeapUsed: 0,
            ramRss: 0,
        };
        // Initialize the latestPoll/latestCpu properties.
        this.pollCpuUsage();
        // Initialize the NodeJS loop counter if applicable.
        if (typeof this.counter !== "undefined") {
            this.counter.start();
        }
    }
    /**
     * Describe the metrics provided by this service.
     *
     * @return
     *   The description.
     */
    NodeInfo.prototype.getDescription = function () {
        var numberTypeName = "number";
        var description = {
            cpuSystem: {
                label: "CPU system seconds since last polling. May be > 1 on multiple cores.",
                type: numberTypeName,
            },
            cpuUser: {
                label: "CPU user seconds since last polling. May be > 1 on multiple cores.",
                type: numberTypeName,
            },
            ramExternal: {
                label: "C++ memory bound to V8 JS objects",
                type: numberTypeName,
            },
            ramHeapTotal: {
                label: "V8 Total heap",
                type: numberTypeName,
            },
            ramHeapUsed: {
                label: "V8 Used heap",
                type: numberTypeName,
            },
            ramRss: {
                label: "Resident Set Size (heap, code segment, stack)",
                type: numberTypeName,
            },
        };
        if (typeof this.counter !== "undefined") {
            description = __assign(__assign({}, description), this.counter.getDescription());
        }
        return description;
    };
    /**
     * Get process information about CPU and RAM usage.
     */
    NodeInfo.prototype.getInfo = function () {
        var ram = this.process.memoryUsage();
        var cpu = this.pollCpuUsage();
        var result = {
            cpuSystem: cpu.system,
            cpuUser: cpu.user,
            ramExternal: ram.external,
            ramHeapTotal: ram.heapTotal,
            ramHeapUsed: ram.heapUsed,
            ramRss: ram.rss,
        };
        if (typeof this.counter !== "undefined") {
            result = __assign(__assign({}, result), this.counter.getInfo());
        }
        return result;
    };
    /**
     * Stop metrics collection, releasing timers.
     */
    NodeInfo.prototype.stop = function () {
        if (typeof this.counter !== "undefined") {
            this.counter.stop();
            delete this.counter;
        }
    };
    /**
     * Update the CPU reading and return it normalized per second.
     *
     * @return
     *   The normalized time spent since last polling.
     */
    NodeInfo.prototype.pollCpuUsage = function () {
        // Date is in msec, cpuUsage is in µsec.
        var ts1 = +new Date() * 1E3;
        var ts0 = this.latestPoll;
        // Although Date has msec resolution, in practice, getting identical dates
        // happens easily, so fake an actual millisecond different if the diff is 0,
        // to avoid infinite normalized CPU usage. 1E3 from msec to µsec.
        var tsDiff = (ts1 - ts0) || 1E3;
        this.latestPoll = ts1;
        var reading0 = this.latestCpu;
        var reading1 = this.process.cpuUsage();
        this.latestCpu = reading1;
        var result = {
            system: (reading1.system - reading0.system) / tsDiff,
            user: (reading1.user - reading0.user) / tsDiff,
        };
        return result;
    };
    return NodeInfo;
}());
exports.NodeInfo = NodeInfo;
//# sourceMappingURL=NodeInfo.js.map