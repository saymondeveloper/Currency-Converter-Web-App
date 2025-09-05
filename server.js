const express = require('express');
const xml2js = require('xml2js');

const app = express();
const PORT = process.env.PORT || 3000;

const ECB_RATES_URL = 'https://www.ecb.europa.eu/stats/eurofxref/eurofxref-daily.xml';

// Serve static frontend from "public" folder
app.use(express.static("public"));

// API endpoint to get exchange rates
app.get('/api/rates', async (req, res) => {
  try {
    // Use Node 18+ native fetch
    const response = await globalThis.fetch(ECB_RATES_URL);
    if (!response.ok) throw new Error('Failed to fetch ECB rates');

    const xml = await response.text();

    xml2js.parseString(xml, { explicitArray: false }, (err, result) => {
      if (err) {
        console.error('XML parse error:', err);
        return res.status(500).json({ success: false, error: { message: 'Failed to parse ECB XML' } });
      }

      try {
        const cubeData = result['gesmes:Envelope'].Cube.Cube.Cube;

        // Build rates object with EUR as base
        const rates = { EUR: 1.0 };
        cubeData.forEach(cube => {
          rates[cube.$.currency] = parseFloat(cube.$.rate);
        });

        res.json({
          success: true,
          base: 'EUR',
          date: result['gesmes:Envelope'].Cube.Cube.$.time,
          rates
        });
      } catch (parseError) {
        console.error('Error extracting rates:', parseError);
        res.status(500).json({ success: false, error: { message: 'Failed to extract rates' } });
      }
    });
  } catch (error) {
    console.error('Fetch error:', error);
    res.status(500).json({ success: false, error: { message: error.message } });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
