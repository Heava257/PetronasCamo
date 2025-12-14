  const numberToKhmerWords = (number, unit = '') => {
    const units = ["", "មួយ", "ពីរ", "បី", "បួន", "ប្រាំ", "ប្រាំមួយ", "ប្រាំពីរ", "ប្រាំបី", "ប្រាំបួន"];
    const tens = ["", "ដប់", "ម្ភៃ", "សាមសិប", "សែសិប", "ហាសិប", "ហុកសិប", "ចិតសិប", "ប៉ែតសិប", "កៅសិប"];
    const scales = ["", "ពាន់", "ម៉ឺន", "លាន", "ដប់លាន", "រយលាន", "ពាន់លាន"];
    
    // Handle unit
    const getUnitInKhmer = (unit) => {
      const cleanUnit = unit?.trim().toUpperCase() || '';
      switch (cleanUnit) {
        case 'L': return 'លីត្រ';
        case 'T': return 'តោន';
        case 'KG': return 'គីឡូក្រាម';
        case 'G': return 'ក្រាម';
        case 'M': return 'ម៉ែត្រ';
        case 'CM': return 'សង់ទីម៉ែត្រ';
        case 'MM': return 'មីលីម៉ែត្រ';
        default: return unit;
      }
    };

    if (number === null || number === undefined || isNaN(number)) return '';
    if (number === 0) return 'សូន្យ' + getUnitInKhmer(unit);
    
    const wholePart = Math.floor(number);
    const decimalPart = Math.round((number - wholePart) * 100);

    const convertLessThanOneMillion = (num) => {
      if (num === 0) return "";
      let str = "";

      if (num >= 100000) {
        const hundredThousands = Math.floor(num / 100000);
        str += units[hundredThousands] + "រយ";
        num %= 100000;
      }

      if (num >= 10000) {
        const tenThousands = Math.floor(num / 10000);
        str += tens[tenThousands];
        num %= 10000;
      }

      if (num >= 1000) {
        const thousands = Math.floor(num / 1000);
        str += units[thousands] + "ពាន់";
        num %= 1000;
      }

      if (num >= 100) {
        const hundreds = Math.floor(num / 100);
        str += units[hundreds] + "រយ";
        num %= 100;
      }

      if (num >= 10) {
        const ten = Math.floor(num / 10);
        str += tens[ten];
        num %= 10;
      }

      if (num > 0) {
        str += units[num];
      }

      return str;
    };

    let wholeWords = "";
    let remaining = wholePart;

    if (remaining === 0) {
      wholeWords = "សូន្យ";
    } else {
      const millions = Math.floor(remaining / 1000000);
      remaining %= 1000000;

      if (millions > 0) {
        wholeWords += convertLessThanOneMillion(millions) + "លាន";
      }

      wholeWords += convertLessThanOneMillion(remaining);
    }

    let decimalWords = "";
    if (decimalPart > 0) {
      decimalWords = " ចុច ";
      if (decimalPart < 10) {
        decimalWords += units[0] + units[decimalPart];
      } else {
        const ten = Math.floor(decimalPart / 10);
        const unit = decimalPart % 10;
        decimalWords += tens[ten] + (unit !== 0 ? units[unit] : "");
      }
    }

    // Final result with unit
    const unitText = getUnitInKhmer(unit);
    return (wholeWords + decimalWords).trim() + (unitText ? unitText : '');
  };