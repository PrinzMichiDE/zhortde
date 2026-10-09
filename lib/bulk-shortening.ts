export interface BulkLinkRequest {
  longUrl: string;
  customCode?: string;
  password?: string;
  expiresIn?: string;
  isPublic?: boolean;
}

/**
 * Parse CSV content
 */
export function parseCSV(csvContent: string): BulkLinkRequest[] {
  const lines = csvContent.split('\n').filter(line => line.trim());
  const requests: BulkLinkRequest[] = [];
  
  // Skip header if present
  const startIndex = lines[0]?.includes('url') || lines[0]?.includes('URL') ? 1 : 0;
  
  for (let i = startIndex; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;
    
    // Simple CSV parsing (handles quoted values)
    const columns = line.split(',').map(col => col.trim().replace(/^"|"$/g, ''));
    
    if (columns.length >= 1 && columns[0]) {
      requests.push({
        longUrl: columns[0],
        customCode: columns[1] || undefined,
        password: columns[2] || undefined,
        expiresIn: columns[3] || undefined,
        isPublic: columns[4] === 'true' || columns[4] === '1',
      });
    }
  }
  
  return requests;
}

/**
 * Parse text input (one URL per line)
 */
export function parseTextInput(textContent: string): BulkLinkRequest[] {
  const lines = textContent.split('\n').filter(line => line.trim());
  return lines.map(line => ({
    longUrl: line.trim(),
  }));
}
