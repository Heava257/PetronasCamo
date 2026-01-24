const Tesseract = require('tesseract.js');
const fs = require('fs');
const { logError, db } = require("../util/helper");

exports.scanSlip = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({
                success: false,
                message: "No image file uploaded"
            });
        }

        const imagePath = req.file.path; // Multer path (Cloudinary URL or local)
        const type = req.body.type || 'customer'; // 'customer' or 'supplier'

        console.log(`Scanning image for ${type}:`, imagePath);

        // Perform OCR
        const { data: { text } } = await Tesseract.recognize(
            imagePath,
            'eng',
            // { logger: m => console.log(m) } // Optional: log progress
        );

        console.log("OCR Text Raw:", text);

        // Extract information
        const result = parseSlipData(text);
        let duplicateFound = false;
        let duplicateMessage = "";

        // Check for duplicates if Reference No exists
        if (result.reference_no) {
            const ref = result.reference_no;
            const note_ref = `%[SlipRef: ${ref}]%`;

            // Check Customer Payments
            const [custRows] = await db.query(
                "SELECT id FROM payments WHERE bank_ref = :ref OR notes LIKE :note_ref",
                { ref, note_ref }
            );

            // Check Supplier Payments
            const [suppRows] = await db.query(
                "SELECT id FROM supplier_payment WHERE bank_ref = :ref OR note LIKE :note_ref",
                { ref, note_ref }
            );

            if (custRows.length > 0 || suppRows.length > 0) {
                duplicateFound = true;
                const location = custRows.length > 0 ? "Customer Payments" : "Supplier Payments";
                duplicateMessage = `⚠️ Duplicate Blocked: This bank slip (Ref: ${ref}) has already been used in ${location}.`;
            }
        }

        res.json({
            success: true,
            data: {
                ...result,
                imagePath: imagePath,
                duplicate: duplicateFound,
                duplicateMessage: duplicateMessage
            },
            raw_text: text
        });

    } catch (error) {
        logError("ocr.scanSlip", error, res);
    }
};

// Helper to parse text based on common bank slip formats (ABA, etc.)
function parseSlipData(text) {
    const lines = text.split('\n').map(l => l.trim()).filter(l => l);

    let result = {
        amount: null,
        date: null,
        reference_no: null,
        bank_name: null,
        payment_method: 'bank_transfer',
        description: '' // Comprehensive description
    };

    // 1. Detect Bank
    if (text.includes('ABA BANK') || text.includes('National Bank of Canada Group')) {
        result.bank_name = 'ABA Bank';
    } else if (text.includes('ACLEDA')) {
        result.bank_name = 'ACLEDA Bank';
    } else if (text.includes('KHQR')) {
        result.bank_name = 'KHQR Payment';
    }

    // 2. Extract Reference #
    // ABA: "Reference #: 100FT..." or just a long alphanumeric string
    const refMatch = text.match(/(?:Reference|Ref|Txn Ref)\s*#?[:.]?\s*([A-Z0-9]+)/i);
    if (refMatch) {
        result.reference_no = refMatch[1];
    } else {
        // Try finding a standalone long numeric/alphanumeric string (often Ref ID)
        const longNumMatch = text.match(/\b\d{9,16}\b/); // 9-16 digits
        if (longNumMatch) result.reference_no = longNumMatch[0];
    }

    // 3. Extract Amount
    // Regex for "$1,950.00" or "1,950.00 USD"
    const amountMatch = text.match(/(\$)?\s*([\d,]+\.\d{2})\s*(USD)?/i);
    if (amountMatch) {
        result.amount = parseFloat(amountMatch[2].replace(/,/g, ''));
    }

    // 4. Extract Date
    // ABA: "Jan 17, 2026 06:35 PM" or "Date : Jan 14, 2026 | 10:12 AM"
    const dateMatch = text.match(/([A-Z][a-z]{2}\s\d{1,2},?\s\d{4}\s*[|]?\s*\d{1,2}:\d{2}\s*(?:AM|PM)?)/i);
    if (dateMatch) {
        // Clean up | separator
        result.date = dateMatch[0].replace('|', '').trim();
    } else {
        const dateSimple = text.match(/(\d{2}[/-]\d{2}[/-]\d{4})/);
        if (dateSimple) result.date = dateSimple[0];
    }

    // 5. Extract Details for Description
    let details = [];

    const paidFromMatch = text.match(/(?:Paid From|From account)\s*[:.]?\s*(.*)/i);
    const paidToMatch = text.match(/(?:To Account|To account)\s*[:.]?\s*(.*)/i);

    // Build a nice multi-line description for the Note field
    let fullNote = "";
    if (result.bank_name) fullNote += `Bank: ${result.bank_name}\n`;
    if (paidFromMatch) fullNote += `From: ${paidFromMatch[1].trim()}\n`;
    if (paidToMatch) fullNote += `To: ${paidToMatch[1].trim()}\n`;
    if (result.date) fullNote += `Date: ${result.date}\n`;
    if (result.amount) fullNote += `Amount: $${result.amount.toLocaleString()}\n`;
    if (result.reference_no) fullNote += `Bank Ref: ${result.reference_no}`;

    result.description = fullNote.trim();
    result.bank_ref = result.reference_no;

    // 6. Heuristic: Is this actually a bank slip?
    const keywords = ['BANK', 'PAID', 'SUCCESS', 'AMOUNT', 'TRANSFER', 'REFERENCE', 'REF #', 'FROM', 'TO', 'DATE', 'TRANSACTION', 'USD', 'KHR', 'KHQR'];
    const lowerText = text.toUpperCase();
    const matches = keywords.filter(k => lowerText.includes(k));

    // If no bank name found AND no reference found AND few keywords present, it's likely NOT a slip
    result.isValidSlip = true;
    if (!result.bank_name && !result.reference_no && matches.length < 2) {
        result.isValidSlip = false;
        result.invalidMessage = "⚠️ This image does not look like a bank slip. No bank details or transaction IDs were detected.";
    }

    return result;
}
