/// <reference types="node" />
import CpuUsage = NodeJS.CpuUsage;
/**
 * Same structure as NodeJS CpuUsage, but not same meaning for the values.
 */
import CpuUsageNormalized = NodeJS.CpuUsage;
import Process = NodeJS.Process;
import Timeout = NodeJS.Timeout;
import { IInfoData, IInfoDescription, IInfoSection } from "./types";
declare type HrTime = [number, number];
interface INodeInfoData extends IInfoData {
    cpuSystem: number;
    cpuUser: number;
    ramExternal: number;
    ramHeapTotal: number;
    ramHeapUsed: number;
    ramRss: number;
    loopDelay: number;
}
/**
 * Provides the Node.JS-related information: RAM, CPU load.
 */
declare class NodeInfo implements IInfoSection {
    protected process: Process;
    /**
     * The interval at which the event loop delay is measured, in milliseconds.
     *
     * This spreads over multiple ticks of the loop to limit measurement costs.
     */
    static EVENT_LOOP_INTERVAL: number;
    protected info: INodeInfoData;
    protected latestCpu: CpuUsage;
    protected latestDelay: number;
    protected latestPoll: number;
    protected latestTime: HrTime;
    protected timer?: Timeout;
    /**
     * @param process
     *   The NodeJS process module or a stub for it.
     *
     * @constructor
     */
    constructor(process: Process);
    /**
     * Describe the metrics provided by this service.
     *
     * @return
     *   The description.
     */
    getDescription(): IInfoDescription;
    /**
     * Get process information about CPU and RAM usage.
     */
    getInfo(): INodeInfoData;
    /**
     * Stop metrics collection, releasing timer.
     */
    stop(): void;
    /**
     * Update the CPU reading and return it normalized per second.
     *
     * @return
     *   The normalized time spent since last polling.
     */
    protected pollCpuUsage(): CpuUsageNormalized;
    protected pollLoop(): number;
    /**
     * Inspired by https://github.com/keymetrics/pmx
     *
     * @see https://github.com/keymetrics/pmx/blob/master/lib/probes/loop_delay.js
     *
     * Used under its MIT license, per pmx README.md
     */
    protected startEventLoopObserver(): void;
}
export { NodeInfo, INodeInfoData, };
