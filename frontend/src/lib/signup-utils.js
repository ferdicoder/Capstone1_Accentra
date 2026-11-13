const LETTERS_ONLY_FIELDS = new Set([
  "firstName", "middleName", "lastName", "extensionName",
]);
const DIGITS_ONLY_FIELDS = new Set(["tin", "contactNumber", "zipCode"]);

export function sanitizeValue(name, value) {
  if (LETTERS_ONLY_FIELDS.has(name)) {
    return value
      .replace(/[^A-Za-z\s'-]/g, "")
      .replace(/(^|[\s'-])([a-z])/g, (_, boundary, letter) =>
        boundary + letter.toUpperCase()
      );
  }

  if (DIGITS_ONLY_FIELDS.has(name)) {
    let digits = value.replace(/\D/g, "");
    if (name === "contactNumber") {
      if (digits.startsWith("63")) digits = digits.slice(2);
      else if (digits.startsWith("0") && digits.length > 10) digits = digits.slice(1);
      return digits.slice(0, 10);
    }
    return digits;
  }
  return value;
}

export function formatTin(value, mask = false) {
  const digits = value.replace(/\D/g, "").slice(0, 12);
  const formatted = digits.replace(/(\d{3})(?=\d)/g, "$1-");

  if (!mask || digits.length <= 4) return formatted;

  let index = 0;
  return formatted.replace(/\d/g, () => {
    const character = index >= digits.length - 4 ? digits[index] : "*";
    index += 1;
    return character;
  });
}

export function formatContactNumber(value, mask = false) {
  const digits = value.replace(/\D/g, "");
  return mask && digits.length > 4
    ? `${"*".repeat(digits.length - 4)}${digits.slice(-4)}`
    : digits;
}
