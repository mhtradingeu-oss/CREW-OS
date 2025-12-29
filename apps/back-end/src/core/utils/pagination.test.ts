import { buildPagination } from "../../core/utils/pagination.js";

describe("buildPagination", () => {
  it("returns correct skip and take for default params", () => {
    expect(buildPagination({})).toEqual({ skip: 0, take: 20 });
  });

  it("caps pageSize at 100", () => {
    expect(buildPagination({ page: 2, pageSize: 200 })).toEqual({ skip: 100, take: 100 });
  });

  it("calculates skip correctly for page > 1", () => {
    expect(buildPagination({ page: 3, pageSize: 10 })).toEqual({ skip: 20, take: 10 });
  });
});
