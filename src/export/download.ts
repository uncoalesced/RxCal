/**
 * Save generated content as a file. The Blob lives only in this tab's memory;
 * nothing is sent over the network.
 */
export function downloadFile(filename: string, content: string, mimeType: string): void {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.rel = 'noopener';
  document.body.appendChild(link);
  link.click();
  link.remove();
  // Revoke later: some browsers read the URL asynchronously after the click.
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
