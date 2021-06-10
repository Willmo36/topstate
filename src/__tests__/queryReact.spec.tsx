import React from "react";
import { renderHook } from "@testing-library/react-hooks";
import { createQueries } from "../query";
import { createInquirierHooks } from "../queryReact";

describe("createInquirerHooks", () => {
	type TestQuery = { tag: "ask_age"; result: number };
	const inquierer = createQueries<TestQuery>();
	const {
		useInquirierEmitter,
		useInquirierResponder,
		QueryContext
	} = createInquirierHooks<TestQuery>();
	const wrapper = ({ children }: { children: React.ReactChildren }) => (
		<QueryContext.Provider value={inquierer}>{children}</QueryContext.Provider>
	);

	it("should get an empty response with no responders registered", () => {
		const { result } = renderHook(() => useInquirierEmitter(), { wrapper });

		const response = result.current({ tag: "ask_age" });
		expect(response).toEqual([]);
	});

	it("should get single element array response with 1 responder registered", () => {
		const age = 99;
		const { result } = renderHook(
			() => {
				useInquirierResponder("ask_age", () => age, []);
				return useInquirierEmitter();
			},
			{ wrapper }
		);

		const response = result.current({ tag: "ask_age" });
		expect(response).toEqual([age]);
	});
});
