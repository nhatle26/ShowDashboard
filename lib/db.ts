import { google } from "googleapis";

export const SHEET_ID = "1ej1tIq4nsR2xmFPL3Wpm47YjorVNsf4qmrW7uLxyvjo";
function getCredentials() {
  const clientEmail = process.env.GOOGLE_CLIENT_EMAIL;
  const privateKey = process.env.GOOGLE_PRIVATE_KEY;

  if (!clientEmail || !privateKey) {
    throw new Error("Missing Google credentials");
  }

  return {
    client_email: clientEmail,
    private_key: privateKey.replace(/\\n/g, "\n"),
  };
}

export async function getSheetsClient() {
  const credentials = getCredentials();

  const auth = new google.auth.JWT({
    email: credentials.client_email,
    key: credentials.private_key,
    scopes: [
      "https://www.googleapis.com/auth/spreadsheets"
    ],
  });

  await auth.authorize();

  return google.sheets({
    version: "v4",
    auth,
  });
}


export async function listSheetTitles(
  spreadsheetId: string = SHEET_ID
): Promise<string[]> {

  const sheets = await getSheetsClient();

  const res = await sheets.spreadsheets.get({
    spreadsheetId,
  });

  return (res.data.sheets || [])
    .map(
      (s) => s.properties?.title || ""
    );
}


export async function appendSheetData(
  range: string, // Ví dụ: "Tasks!A:B"
  values: string[][]
) {

  const sheets = await getSheetsClient();

  await sheets.spreadsheets.values.append({
    spreadsheetId: SHEET_ID,
    range: range,
    valueInputOption: "USER_ENTERED",
    requestBody: {
      values,
    },
  });
}