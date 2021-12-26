import { json } from "remix";

export const badRequest = (data: any, headers?: Headers) =>
  json(data, { status: 400, headers });
