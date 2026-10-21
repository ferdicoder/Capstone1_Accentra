// Address helpers for the Firm Details form. Pure formatting/parsing/validation.

// Label used for each part, in the form and in the serialised string.
export const ADDRESS_LABELS = {
  line1: "Address Line 1",
  line2: "Address Line 2",
  barangay: "Barangay",
  city: "City/Municipality",
  province: "Province",
  region: "Region",
  postalCode: "Postal Code",
  country: "Country",
}

export const ADDRESS_FIELD_KEYS = Object.keys(ADDRESS_LABELS)

// Form definition for each field (no JSX — the page renders it).
export const ADDRESS_FIELD_DEFS = [
  {
    key: "line1",
    label: "Address Line 1",
    placeholder: "Unit 204, 2nd Floor, ABC Corporate Center",
    autoComplete: "address-line1",
    fullWidth: true,
    hint: "Unit, floor, building, street number and street name.",
  },
  {
    key: "line2",
    label: "Address Line 2",
    placeholder: "123 Ayala Avenue",
    autoComplete: "address-line2",
    fullWidth: true,
    optional: true,
  },
  {
    key: "barangay",
    label: "Barangay",
    placeholder: "San Lorenzo",
    autoComplete: "address-level3",
  },
  {
    key: "city",
    label: "City / Municipality",
    placeholder: "Makati City",
    autoComplete: "address-level2",
  },
  {
    key: "province",
    label: "Province",
    placeholder: "Rizal",
    autoComplete: "address-level4",
    optional: true,
    hint: "Not applicable to addresses within Metro Manila.",
  },
  {
    key: "region",
    label: "Region",
    placeholder: "National Capital Region",
  },
  {
    key: "postalCode",
    label: "Postal Code",
    placeholder: "1223",
    autoComplete: "postal-code",
  },
  {
    key: "country",
    label: "Country",
    placeholder: "Philippines",
    autoComplete: "country",
  },
]

// An address with every component empty.
export const emptyAddressParts = () =>
  ADDRESS_FIELD_KEYS.reduce((parts, key) => ({ ...parts, [key]: "" }), {})

// Values a person types to say "this part does not apply to my address".
const NOT_APPLICABLE_VALUES = ["not applicable", "not-applicable", "n/a"]

// Trims the ends, keeping internal spacing intact.
export const cleanAddressValue = (value) =>
  typeof value === "string" ? value.trim() : ""

// True when the value is a "not applicable" placeholder.
export const isNotApplicable = (value) =>
  NOT_APPLICABLE_VALUES.includes(cleanAddressValue(value).toLowerCase())

// The value as it should be shown or saved.
export const addressValue = (value) =>
  isNotApplicable(value) ? "" : cleanAddressValue(value)

const sameText = (a, b) =>
  Boolean(a) && Boolean(b) && a.toLowerCase() === b.toLowerCase()

// Philippine addresses have the extra locality rules.
export const isPhilippineAddress = (parts = {}) => {
  const country = cleanAddressValue(parts.country).toLowerCase()
  return country === "philippines" || country === "ph"
}

// Metro Manila (NCR) has no province.
export const isMetroManilaRegion = (region) => {
  const value = cleanAddressValue(region).toLowerCase()
  return value === "national capital region" || value === "ncr"
}

// Which parts are required for the given values.
export const getAddressRequirements = (parts = {}) => {
  const philippine = isPhilippineAddress(parts)
  const region = cleanAddressValue(parts.region)

  return {
    line1: true,
    line2: false,
    barangay: philippine,
    city: true,
    province: philippine && region !== "" && !isMetroManilaRegion(region),
    region: philippine,
    postalCode: philippine,
    country: true,
  }
}

// Serialises the parts into the single address string (empty parts omitted).
export const serializeAddressParts = (parts = {}) =>
  ADDRESS_FIELD_KEYS.map((key) => {
    const value = cleanAddressValue(parts[key]).replace(/\s*\n\s*/g, " ")
    return value ? `${ADDRESS_LABELS[key]}: ${value}` : null
  })
    .filter(Boolean)
    .join("\n")

// Parses the address string back into parts. isLegacy is true when the value
// was not written by serializeAddressParts, and raw then holds it untouched.
export const parseAddressString = (raw) => {
  const text = typeof raw === "string" ? raw.trim() : ""
  if (!text) return { parts: emptyAddressParts(), isLegacy: false }

  const parsed = {}
  for (const line of text.split("\n")) {
    const trimmed = line.trim()
    if (!trimmed) continue

    const separator = trimmed.indexOf(":")
    if (separator === -1) return { parts: null, isLegacy: true, raw: text }

    const label = trimmed.slice(0, separator).trim().toLowerCase()
    const key = ADDRESS_FIELD_KEYS.find(
      (candidate) => ADDRESS_LABELS[candidate].toLowerCase() === label
    )
    // An unrecognised label means this was not written by us — keep it as is.
    if (!key) return { parts: null, isLegacy: true, raw: text }
    parsed[key] = trimmed.slice(separator + 1).trim()
  }

  return { parts: { ...emptyAddressParts(), ...parsed }, isLegacy: false }
}

// Formats the parts for display. Empty parts are omitted, repeats are dropped.
export const formatAddress = (parts = {}) => {
  const value = (key) => addressValue(parts[key])

  const line1 = value("line1")
  const line2 = value("line2")
  const barangay = value("barangay")
  const city = value("city")
  const province = value("province")
  const region = value("region")
  const postalCode = value("postalCode")
  const country = value("country")

  const lines = []

  const firstLine = [line1, line2].filter(Boolean).join(", ")
  if (firstLine) lines.push(firstLine)

  const locality = [barangay ? `Barangay ${barangay}` : "", city]
    .filter(Boolean)
    .join(", ")
  if (locality) lines.push(locality)

  const regionLine = []
  if (province && !sameText(province, region)) regionLine.push(province)
  if (region && !sameText(region, country)) regionLine.push(region)
  if (postalCode) regionLine.push(postalCode)
  if (regionLine.length) lines.push(regionLine.join(", "))

  if (country) lines.push(country)

  return lines.join("\n")
}

// Returns a map of field key to validation message.
export const validateAddressParts = (parts = {}, { isLegacy = false } = {}) => {
  const errors = {}
  const requirements = getAddressRequirements(parts)
  const value = (key) => addressValue(parts[key])

  if (!value("line1")) errors.line1 = "Enter the firm's address."

  // A preserved free-text address stands on its own until it is edited.
  if (isLegacy) return errors

  if (!value("city")) errors.city = "Enter the city or municipality."
  if (!value("country")) errors.country = "Enter the country."

  if (requirements.barangay && !value("barangay")) {
    errors.barangay = "Enter the barangay."
  }
  if (requirements.region && !value("region")) {
    errors.region = "Enter the region."
  }
  if (requirements.province && !value("province")) {
    errors.province = "Enter the province."
  }
  if (requirements.postalCode) {
    const postalCode = value("postalCode")
    if (!postalCode) {
      errors.postalCode = "Enter the postal code."
    } else if (!/^\d{4}$/.test(postalCode)) {
      errors.postalCode = "ZIP code must be 4 digits."
    }
  }

  return errors
}
