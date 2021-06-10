import { createQueries } from "../query";

type Queries = { tag: "ask_data"; arg1: 1; result: number };

describe("queries", () => {
	it("should emit a query to responders", () => {
		const queries = createQueries<Queries>();

		const response = 4;
		let responder: () => number = jest.fn(() => response);

		queries.register("ask_data", responder);

		const result = queries.query({ tag: "ask_data", arg1: 1 });

		expect(result).toEqual([response]);
	});
});
