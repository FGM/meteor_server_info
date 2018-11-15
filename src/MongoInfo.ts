import {Counter, IInfoData, IInfoSection} from "./ServerInfo";

interface MongoInfoData extends IInfoData {
  nObserveHandles:            number,
  oplogObserveHandles:        Counter,
  oplogObserveHandlesCount:   number,
  pollingObserveHandles:      Counter,
  pollingObserveHandlesCount: number,
}

interface observerHandle {
  _observeDriver?: any,
  _multiplexer: any,
}

/**
 * Provides the MongoDB-related information: observers and observed collections.
 */
class MongoInfo implements IInfoSection {
  public info: MongoInfoData;
  public muxes: any;

  /**
   * Constructor.
   *
   * @param {Object} MongoInternals
   *   The Meteor MongoInternals service.
   *
   * @constructor
   */
  constructor(MongoInternals: any) {
    this.info = {
      nObserveHandles:            0,
      oplogObserveHandles:        new Map(),
      oplogObserveHandlesCount:   0,
      pollingObserveHandles:      new Map(),
      pollingObserveHandlesCount: 0,
    };
    this.muxes = MongoInternals.defaultRemoteCollectionDriver().mongo._observeMultiplexers;
  }

  /**
   * Build information about observed collections into this.info.
   *
   * @param {String} type
   *   The observer type.
   * @param {String} collectionName
   *   The observed collection name.
   *
   * @returns {void}
   *
   * @private
   */
  buildCollectionInfo(type: "pollingObserveHandles"|"oplogObserveHandles", collectionName: string) {
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
    this.info[type].set(collectionName,
      // Counter was defined in constructor, collection in previous line.
      this.info[type]!.get(collectionName)! + 1);
  }

  /**
   * Build information about observed collections into this.info.
   *
   * @param {Object} handle
   *   The private structure held by Meteor for an observer.
   *
   * @returns {void}
   *
   * @private
   */
  buildHandleInfo(handle: observerHandle) {
    this.info.nObserveHandles += 1;

    // TODO check whether handle._observeDriver can actually occur.
    const driver = handle._observeDriver || handle._multiplexer._observeDriver;

    const collectionName = driver._cursorDescription.collectionName;
    const observerType = driver._usesOplog ? "oplogObserveHandles" : "pollingObserveHandles";
    this.buildCollectionInfo(observerType, collectionName);
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
  static getDescription() {
    const description = {
      nObserveHandles:            { type: "integer", label: "Overall observers count" },
      oplogObserveHandles:        { type: "array", label: "Oplog-based observers[]" },
      oplogObserveHandlesCount:   { type: "integer", label: "Oplog-based observers" },
      pollingObserveHandles:      { type: "array", label: "Polling-based observers[]" },
      pollingObserveHandlesCount: { type: "integer", label: "Polling-based observers" },
    };

    return description;
  }

  /**
   * Get MongoDB-level information.
   *
   * @returns {*}
   *   - nObserveHandles: the total count of observe handles
   *   - oplogObserveHandles hash: count of oplog observers by collection
   *   - oplogObserveHandlesCount: the total count of oplog observers
   *   - pollingObserveHandles hash: count of polling observers by collection
   *   - pollingObserveHandlesCount: the total count of polling observers.
   */
  getInfo(): MongoInfoData {
    for (const mux of Object.values(this.muxes)) {
      const mux2 = mux as { _handles: { [key: string]: observerHandle }} ;
      for (const handle of Object.values(mux2._handles)) {
        this.buildHandleInfo(handle);
      }
    }

    return this.info;
  }
}

export default MongoInfo;