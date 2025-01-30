/**
 * Extracts email addresses and phone numbers from the given content.
 *
 * @param {string} content - The content to extract data from.
 * @returns {Object} An object containing arrays of extracted emails and phone numbers.
 * @returns {string[]} returns.emails - An array of unique email addresses found in the content, limited to 4.
 * @returns {string[]} returns.phones - An array of unique phone numbers found in the content, limited to 4.
 */
export default function extractData(content) {
  const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
  let emails = content.match(emailRegex) || [];
  emails = emails.filter(
    (email) => !/\.(png|jpg|jpeg|gif|bmp|tiff|webp|webpack)$/i.test(email)
  );
  emails = [...new Set(emails)];
  emails = emails.slice(0, 4);
  const phoneRegex =
    /(\+?\d{1,3}[\s-]?)?(\(?\d{2,4}\)?[\s-]?)?(\d{3,4}[\s-]?\d{3,4})/g;
  let phones = content.match(phoneRegex) || [];
  phones = phones.filter((phone) => {
    phone = phone.replace(/\D/g, "");
    return (
      phone.length >= 8 &&
      phone.length <= 15 &&
      !/^0+$/.test(phone) &&
      !/^1+$/.test(phone) &&
      !/^2+$/.test(phone) &&
      !/^(\d)\1{5,}$/.test(phone)
    );
  });
  phones = [...new Set(phones)];
  phones.sort((a, b) => (a.startsWith("+") ? -1 : 1));
  phones = phones.slice(0, 4);
  return { emails, phones };
}
