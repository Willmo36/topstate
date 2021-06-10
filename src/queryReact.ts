import React, { createContext, useContext } from "react";
import { InquirerReact, Inquirier, Query } from "./types";

export const createInquirierHooks = <Q extends Query>(): InquirerReact<Q> => {
  const QueryContext = createContext<Inquirier<Q> | null>(null);
  const useInquirier = () =>
    assertInquirierContextValue(useContext(QueryContext));

  const hooks: InquirerReact<Q> = {
    QueryContext,
    useInquirierEmitter: () => {
      const inquirier = useInquirier();
      return React.useCallback((q) => inquirier.query(q), []);
    },
    useInquirierResponder: (tag, cb, additionalDeps) => {
      const inquirier = useInquirier();
      return React.useEffect(() => {
        return inquirier.register(tag, cb);
      }, additionalDeps);
    },
  };

  return hooks;
};

const assertInquirierContextValue = <S>(value: S | null): S => {
  if (value === null) {
    throw new Error(
      "Found no Inquirer instance found when trying to read from the context provider."
    );
  }
  return value;
};
