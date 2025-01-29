/**
 * Extracts email addresses and phone numbers from the given content.
 *
 * @param {string} content - The content from which to extract data.
 * @returns {{ emails: string[], phones: string[] }} An object containing arrays of extracted emails and phone numbers.
 */
export default function extractData(content) {
  const emails = content.match(/[\w.-]+@[a-zA-Z_-]+?\.[a-zA-Z]{2,}/g) || [];
  const phones =
    content.match(
      /(\+?\d{1,3}[-.\s]?)?\(?\d{1,4}\)?[-.\s]?\d{1,4}[-.\s]?\d{1,9}/g
    ) || [];
  return { emails, phones };
}
