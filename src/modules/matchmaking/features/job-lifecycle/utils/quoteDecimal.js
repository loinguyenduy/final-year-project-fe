const parsePositiveInteger = (value) => {
  const raw = String(value ?? '').trim();
  if (!/^\d+$/.test(raw)) return null;
  const parsed = BigInt(raw);
  return parsed > 0n && parsed <= 2147483647n ? parsed : null;
};

const parseVndInteger = (value) => {
  const raw = String(value ?? '').trim();
  const match = /^(\d+)(?:\.0+)?$/.exec(raw);
  return match ? BigInt(match[1]) : null;
};

const calculateQuotePreview = ({ items }) => {
  let subtotal = 0n;
  const lineTotals = [];

  for (const item of items || []) {
    const quantity = parsePositiveInteger(item.quantity);
    const unitPrice = parseVndInteger(item.unit_price);
    if (quantity === null || unitPrice === null) {
      return {
        valid: false,
        lineTotals: (items || []).map(() => null),
        subtotal: null,
        total: null,
      };
    }
    const lineTotal = quantity * unitPrice;
    lineTotals.push(lineTotal.toString());
    subtotal += lineTotal;
  }

  return {
    valid: true,
    lineTotals,
    subtotal: subtotal.toString(),
    total: subtotal.toString(),
  };
};

const splitDurationMinutes = (value) => {
  if (value === null || value === undefined || value === '') {
    return { hours: '', minutes: '' };
  }
  const total = Number(value);
  if (!Number.isInteger(total) || total < 0) return { hours: '', minutes: '' };
  return {
    hours: String(Math.floor(total / 60)),
    minutes: String(total % 60),
  };
};

const combineDurationMinutes = ({ hours, minutes, maxMinutes }) => {
  const rawHours = String(hours ?? '').trim();
  const rawMinutes = String(minutes ?? '').trim();
  if (!rawHours && !rawMinutes) return { valid: true, value: null };
  if (!/^\d+$/.test(rawHours || '0') || !/^\d+$/.test(rawMinutes || '0')) {
    return { valid: false, message: 'Duration hours and minutes must be whole numbers.' };
  }
  const hoursValue = Number(rawHours || '0');
  const minutesValue = Number(rawMinutes || '0');
  if (!Number.isSafeInteger(hoursValue) || minutesValue < 0 || minutesValue > 59) {
    return { valid: false, message: 'Duration minutes must be between 0 and 59.' };
  }
  const total = (hoursValue * 60) + minutesValue;
  if (total < 1 || total > maxMinutes) {
    return {
      valid: false,
      message: `Total duration must be between 1 and ${maxMinutes.toLocaleString('en-US')} minutes.`,
    };
  }
  return { valid: true, value: total };
};

export {
  calculateQuotePreview,
  combineDurationMinutes,
  parsePositiveInteger,
  parseVndInteger,
  splitDurationMinutes,
};
