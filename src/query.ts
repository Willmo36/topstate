import { Inquirier, Query, RegisterQueryResponder, RunQuery } from "./types";

export function createQueries<Q extends Query>(): Inquirier<Q> {
    const responders: Record<string, Array<RunQuery<Q>>> = {};

    const register: RegisterQueryResponder<Q> = (tag, cb) => {
        const qt = tag as Q["tag"];
        responders[qt] = [...(responders[qt] ?? []), cb];
        return () => {
            responders[qt] = responders[qt].filter((res) => res !== cb);
        };
    };

    const runQuery: RunQuery<Q> = (query) => {
        return (responders[query.tag] ?? []).map((cb) => cb(query));
    };

    return {
        register,
        query: runQuery
    };
}
