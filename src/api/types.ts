export type HTTPErrorResponse = { success: false; error: string };

export type HTTPDataResponse<Data> =
  | HTTPErrorResponse
  | { success: true; data: Data };

export type HTTPSuccessResponse = HTTPErrorResponse | { success: true };
