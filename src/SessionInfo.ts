import {
  Counter,
  IAnyByString,
  IInfoData,
  IInfoDescription,
  IInfoSection,
} from "./types";

interface ISessionInfoData extends IInfoData {
  nDocuments: Counter,
  nSessions: number,
  nSubs: Counter,
  usersWithNSubscriptions: Counter,
}

interface INamedSessions {
  [key: string]: ISession,
}

interface INamedSubscriptions {
  [subscriptionName: string]: ISubscription,
}

interface ISession {
  _namedSubs: INamedSubscriptions,
  _universalSubs?: ISubscription[],
  id: string,
}

interface ISubscription {
  _documents: ISubscriptionDocuments,
  _name: string,
}

interface IDocumentIds {
  /* tslint:disable-next-line:callable-types */
  [_id: string]: boolean,
}

interface ISubscriptionDocuments {
  [collection: string]: IDocumentIds,
}

/**
 * Provides the session-related information: sessions, subscriptions, documents.
 */
class SessionInfo implements IInfoSection {
  protected info: ISessionInfoData;

  /**
   * @param sessions
   *   The private structure held by Meteor for its sessions list.
   *
   * @constructor
   */
  constructor(protected sessions: INamedSessions | Map<string, ISession>) {
    this.info = this.defaultInfo();
  }

  /**
   * Describe the metrics provided by this service.
   */
  public getDescription(): IInfoDescription {
    const description = {
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
  }

  /**
   * Get session information.
   *
   * @return
   *   - nSessions: the overall number of sessions
   *   - usersWithNSubscriptions: a Counter of the users count per number of subs.
   *   - nSubs: a Counter of subscriptions count per subscription name
   *   - nDocuments: a Counter of document counts per subscription
   */
  public getInfo(): ISessionInfoData {
    this.info = this.defaultInfo();

    // New format required starting with Meteor 1.8.1.
    if (this.sessions instanceof Map) {
      this.info.nSessions = this.sessions.size;
      this.sessions.forEach((s: any, id: string) => {
        // Convert typed NamedSubs to legacy base objects.
        const session = {
          _namedSubs: ((subs: Map<string, IAnyByString>) => {
            const r: IAnyByString = {};
            for (const [k, v] of subs) {
              r[k]  = v;
            }
            return r;
          })(s._namedSubs as Map<string, any>),
          id,
        };
        this.addPerSessionInfo(Object.values(session._namedSubs));
      });
    } else {
      this.info.nSessions = Object.keys(this.sessions).length;
      for (let session of Object.values(this.sessions)) {
        session = {
          _namedSubs: session._namedSubs,
          id: session.id,
        };
        this.addPerSessionInfo(Object.values(session._namedSubs));
      }
    }

    return this.info;
  }

  /**
   * Add the session information to this.info.
   *
   * @param subscriptions
   *   The private structure held by Meteor for the subscriptions of a session.
   */
  protected addPerSessionInfo(subscriptions: ISubscription[]): void {
    const subCount = subscriptions.length;
    this.incrementCounter(this.info.usersWithNSubscriptions, subCount);
    this.addPerSessionSubscriptionInfo(subscriptions);
  }

  /**
   * Build the subscription information for a session into this.info.
   *
   * @param subscriptions
   *   The private structure held by Meteor for a subscription within a session.
   */
  protected addPerSessionSubscriptionInfo(subscriptions: ISubscription[]): void {
    for (let subscription of subscriptions) {
      subscription = {
        _documents: subscription._documents,
        _name: subscription._name,
      };
      this.incrementCounter(this.info.nSubs, subscription._name);
      this._buildDocumentCountsPerSubscription(subscription._documents);
    }
  }

  /**
   * Provide info initialization data, to allow recalculating it on an instance.
   */
  protected defaultInfo(): ISessionInfoData {
    return {
      nDocuments:              new Map(),
      nSessions:               0,
      nSubs:                   new Map(),
      usersWithNSubscriptions: new Map(),
    };
  }

  /**
   * Increment counter value for a key, initializing if needed.
   *
   * @param counter
   * @param key
   * @param increment
   */
  protected incrementCounter(counter: Counter, key: any, increment: number = 1) {
    this.initKey(counter, key);
    // get() is guaranteed to be defined because we just did initKey().
    // TODO: inline after Node >= 10.7 when NanoTs is removed.
    const val: number = counter.get(key)! as number;
    counter.set(key, val + increment);
  }

  /**
   * Ensure initialization of a counter. Do not modify it if alreay set.
   *
   * @param part
   *   The container for the counter.
   * @param key
   *   The counter name.
   */
  protected initKey(part: Counter, key: number|string): void {
    if (!part.has(key)) {
      part.set(key, 0);
    }
  }

  /**
   * Build the document information for a subscription into this.info.
   *
   * @param documents
   *   The private structure held by Meteor for the documents of a subscription.
   */
  protected _buildDocumentCountsPerSubscription(documents: ISubscriptionDocuments): void {
    const entries: [string, IDocumentIds][] = Object.entries(documents);
    for (const entry of entries) {
      // Inlining the destructuring in for() loses type information, so do it here.
      const [type, document] = entry;
      this.incrementCounter(this.info.nDocuments, type, Object.keys(document).length);
    }
  }
}

export {
  ISession,
  ISessionInfoData,
  SessionInfo,

  // Only for tests
  INamedSessions,
  ISubscription,
};
