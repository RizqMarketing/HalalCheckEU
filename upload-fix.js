// Fixed upload endpoint structure
app.post('/api/upload', upload.single('file'), async (req, res) => {
    // Ensure we always send JSON responses
    res.setHeader('Content-Type', 'application/json');
    
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'No file uploaded' });
        }

        console.log(`🔄 Processing file: ${req.file.originalname} (${req.file.mimetype})`);
        
        const filePath = req.file.path;
        const originalName = req.file.originalname;
        const mimeType = req.file.mimetype;
        
        let products = [];
        
        // Extract text using universal extraction function
        let extractionResult;
        try {
            console.log('🔍 Starting text extraction...');
            extractionResult = await extractTextFromFile(filePath, mimeType, originalName);
            console.log(`✅ Text extraction completed: ${extractionResult.rawText.length} chars from ${extractionResult.fileType}`);
        } catch (extractionError) {
            console.error('❌ Text extraction failed:', extractionError);
            // Clean up file and return error
            if (fs.existsSync(filePath)) {
                fs.unlinkSync(filePath);
            }
            return res.status(500).json({ 
                error: 'Text extraction failed', 
                details: extractionError.message,
                fileType: originalName
            });
        }

        const { rawText, fileType } = extractionResult;
            
        // Try AI-powered smart parsing first
        if (rawText && rawText.trim().length > 50) {
            try {
                console.log(`🤖 Attempting AI parsing for ${fileType} file...`);
                products = await parseWithAI(rawText, fileType);
                console.log(`✅ AI parsing successful: ${products.length} products found`);
            } catch (aiError) {
                console.log(`❌ AI parsing failed: ${aiError.message}, trying fallback parsing...`);
                // Fall back to traditional parsing methods
                if (mimeType.includes('spreadsheet') || originalName.endsWith('.xlsx') || originalName.endsWith('.xls')) {
                    products = await parseExcelFile(filePath);
                } else if (mimeType === 'application/pdf') {
                    products = await parsePDFFile(filePath);
                } else if (mimeType === 'text/csv' || originalName.endsWith('.csv')) {
                    products = await parseCSVFile(filePath);
                } else if (mimeType === 'text/plain') {
                    // Simple format parsing
                    const lines = rawText.split('\n').filter(line => line.trim());
                    for (const line of lines) {
                        if (line.includes(':')) {
                            const [productName, ingredients] = line.split(':', 2);
                            if (productName.trim() && ingredients.trim()) {
                                products.push({
                                    productName: productName.trim(),
                                    ingredients: ingredients.trim()
                                });
                            }
                        }
                    }
                }
            }
        } else {
            console.log('File too small or empty, using fallback parsing...');
            // Use fallback parsing for small files
            if (mimeType.includes('spreadsheet') || originalName.endsWith('.xlsx') || originalName.endsWith('.xls')) {
                products = await parseExcelFile(filePath);
            } else if (mimeType === 'application/pdf') {
                products = await parsePDFFile(filePath);
            } else if (mimeType === 'text/csv' || originalName.endsWith('.csv')) {
                products = await parseCSVFile(filePath);
            }
        }
        
        // Clean up uploaded file
        fs.unlinkSync(filePath);
        
        if (products.length === 0) {
            return res.status(400).json({ 
                error: 'No valid products found in file',
                message: 'Please ensure your file contains product names and ingredients in the expected format'
            });
        }

        // Return summary with option to analyze
        res.json({
            success: true,
            count: products.length,
            products: products.slice(0, 5), // Return first 5 as preview
            message: `Successfully extracted ${products.length} products. Ready for analysis.`,
            totalProducts: products.length
        });
        
    } catch (error) {
        console.error('File upload error:', error);
        
        // Clean up file on any error
        if (req.file?.path && fs.existsSync(req.file.path)) {
            fs.unlinkSync(req.file.path);
        }
        
        // Provide more specific error messages for different failure types
        let errorMessage = 'File processing failed';
        if (error.message.includes('textract')) {
            errorMessage = 'Document text extraction failed - file may be corrupted or in an unsupported format';
        } else if (error.message.includes('RTF') || error.message.includes('rtf')) {
            errorMessage = 'RTF file processing failed - trying alternative parsing method';
        } else if (error.message.includes('AI parsing') || error.message.includes('parseWithAI')) {
            errorMessage = 'AI parsing failed - using fallback extraction method';
        }
        
        res.status(500).json({ 
            error: errorMessage, 
            details: error.message,
            fileType: req.file?.originalname || 'unknown'
        });
    }
});