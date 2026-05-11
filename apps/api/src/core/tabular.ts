import * as XLSX from "xlsx";

/**
 * Parses spreadsheet buffers into serialized text
 */
export function parseSpreadsheetToText(buffer: Buffer, extension: string): string {
  try {
    const workbook = XLSX.read(buffer, { type: "buffer" });
    
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    
    if (!worksheet) {
      return "[Empty Spreadsheet]";
    }

    const jsonData = XLSX.utils.sheet_to_json<any[]>(worksheet, { header: 1 });
    
    if (!jsonData || jsonData.length === 0) {
      return "[Empty Sheet]";
    }

    const limitRows = jsonData.slice(0, 50);
    
    let output = `Sheet: "${sheetName}"\n`;
    
    limitRows.forEach((row, index) => {
      const line = Array.isArray(row) 
        ? row.map(cell => cell === null || cell === undefined ? "" : String(cell).replace(/\n/g, " ").trim()).join(" | ")
        : String(row);
      
      output += `${index === 0 ? "[HEADERS]" : `[R${index}]`} : ${line}\n`;
    });

    if (jsonData.length > 50) {
      output += `\n... [TRUNCATED: Total rows: ${jsonData.length}. Only first 50 indexed for initial context]`;
    }

    return output;
  } catch (err) {
    console.error("[Tabular] Parsing failure:", err);
    return `[Error parsing spreadsheet file content: ${err instanceof Error ? err.message : 'Unknown'}]`;
  }
}
